import os
import logging
import warnings
import opentracing

from flask import Flask

from datetime import datetime, timedelta

from gevent.pool import Pool

from opentracing_utils import trace, extract_span_from_kwargs

from app.config import MAX_QUERY_TIME_SLICE, UPDATER_CONCURRENCY
from app.extensions import db
from app.libs.zmon import query_sli, MIN_VAL

from .models import IndicatorValue, Indicator
from .models import insert_indicator_value, update_indicator_value_compact


logger = logging.getLogger(__name__)

updater_pool = Pool(UPDATER_CONCURRENCY)


def update_all_indicators(app: Flask):
    """
    Update all indicators async!
    """
    if os.environ.get('SLR_LOCAL_ENV'):
        warnings.warn('Running on local env while not setting up gevent properly!')

    for indicator in Indicator.query.all():
        try:
            if indicator.is_deleted is True:
                continue
            updater_pool.spawn(update_indicator, app, indicator)
        except Exception:
            logger.exception('Updater: Failed to spawn indicator updater!')

    updater_pool.join()


def update_indicator(app: Flask, indicator: Indicator):
    logger.info('Updater: Updating Indicator {} values for product {}'.format(indicator.name, indicator.product.name))

    with app.app_context():
        now = datetime.utcnow()
        newest_dt = now - timedelta(minutes=MAX_QUERY_TIME_SLICE)

        try:
            newest_iv = (
                IndicatorValue.query.
                with_entities(db.func.max(IndicatorValue.timestamp).label('timestamp')).
                filter(IndicatorValue.timestamp >= newest_dt,
                       IndicatorValue.timestamp < now,
                       IndicatorValue.indicator_id == indicator.id).
                first()
            )

            if newest_iv and newest_iv.timestamp:
                start = (now - newest_iv.timestamp).seconds // 60 + 5  # add some overlapping
            else:
                start = MAX_QUERY_TIME_SLICE

            count = update_indicator_values(indicator, start=start)
            logger.info('Updater: Updated {} indicator values "{}" for product "{}"'.format(
                count, indicator.name, indicator.product.name))
        except Exception:
            logger.exception('Updater: Failed to update indicator "{}" values for product "{}"'.format(
                indicator.name, indicator.product.name))


@trace(pass_span=True)
def update_indicator_values(indicator: Indicator, start: int, end=None, **kwargs):
    """Query and update indicator values"""
    current_span = extract_span_from_kwargs(**kwargs)

    session = db.session

    result = query_sli(indicator.name, indicator.source, start, end)

    insert_span = opentracing.tracer.start_span(operation_name='insert_indicator_values', child_of=current_span)
    (insert_span
        .set_tag('indicator', indicator.name)
        .set_tag('indicator_id', indicator.id)
        .set_tag('compact', False))

    insert_span.log_kv({'result_count': len(result)})

    with insert_span:
        for minute, val in result.items():
            if val > 0:
                val = max(val, MIN_VAL)
            elif val < 0:
                val = min(val, MIN_VAL * -1)

            iv = IndicatorValue(timestamp=minute, value=val, indicator_id=indicator.id)
            insert_indicator_value(session, iv)

        session.commit()

    insert_compact_span = opentracing.tracer.start_span(operation_name='insert_indicator_values', child_of=current_span)
    (insert_compact_span
        .set_tag('indicator', indicator.name)
        .set_tag('indicator_id', indicator.id)
        .set_tag('compact', True))

    insert_compact_span.log_kv({'result_count': len(result)})

    with insert_compact_span:
        update_indicator_value_compact(session, indicator.id, result)
        session.commit()

    return len(result)
