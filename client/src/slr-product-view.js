import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/app-route/app-route.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import '@polymer/iron-label/iron-label.js';
import '@polymer/iron-media-query/iron-media-query.js';
import './slr-ajax.js';
import './slr-form.js';
import './slr-items-data.js';
import './slr-dialog.js';
import './slr-objective-view.js';
import './slr-indicator-view.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
class SlrProductView extends PolymerElement {
  static get template() {
    return html`
    <style include="common-styles">
      :host {
        display: block;
        @apply --slr-content;
        text-align: left;
      }

      paper-card {
        width: 100%;
        overflow: hidden;
        padding: 5px 10px;
      }

      paper-item {
        opacity: 0.66;
      }

      paper-item:hover {
        background-color: var(--app-secondary-color);
      }

      paper-item paper-icon-button {
        position: absolute;
        right: 10px;
        display: none;
      }

      paper-item:hover paper-icon-button {
        display: block;
      }

      paper-listbox {
        padding: 0;
      }

      slr-form {
        @apply --layout-vertical;
        height: 100%;
      }

      form {
        @apply --layout-vertical;
        flex: 1;
      }

      paper-dialog-scrollable {
        margin-top: 10px;
        flex: 1;
      }

      .container {
        @apply --layout-vertical;
        flex: 1;
      }

      .lists {
        @apply --layout-horizontal;
        flex: 1;
      }

      .container[small-layout] {
        flex-flow: column;
      }

      .column {
         height: 100%;
         flex: 1;
         display: flex;
         flex-direction: column;
      }

      .column[small-layout] {
        width: 100%;
      }

    </style>

    <app-route route="{{route}}" pattern="/:slug" data="{{routeData}}" tail="{{subroute}}"></app-route>

    <iron-media-query query="(max-width: 600px)" query-matches="{{small}}"></iron-media-query>

    <slr-ajax id="productAjax" url="/api/products" params="{{params}}" loading="{{loading}}" on-response="handleProductResponse" on-error="handleProductErrorResponse" debounce-duration="300"></slr-ajax>

    <slr-ajax auto="" id="productGroupAjax" url="[[item.product_group_uri]]" loading="{{loading}}" handle-as="json" on-response="handleProductGroupResponse" on-error="handleProductGroupErrorResponse" debounce-duration="300"></slr-ajax>

    <slr-items-data id="productGroupsData" url="/api/product-groups" search="[[productGroupsSearch]]" loading="{{loading}}" items="{{productGroups}}"></slr-items-data>

    <slr-items-data auto="" id="objectivesData" id-name="id" items="{{objectives}}" url="[[item.product_slo_uri]]" item-type="Objective" loading="{{loading}}"></slr-items-data>

    <slr-items-data auto="true" id="indicatorsData" id-name="name" items="{{indicators}}" url="[[item.product_sli_uri]]" item-type="Indicator" loading="{{loading}}"></slr-items-data>

    <slr-objective-view id="objectiveView" item="{{selectedObjective}}" product="[[item]]" objectives="[[objectives]]" indicators="[[indicators]]" loading="{{loading}}" route="{{subroute}}" route-data="{{routeData}}" opened="{{objectiveViewOpened}}" visible="{{visible}}"></slr-objective-view>

    <slr-indicator-view id="indicatorView" item="{{selectedIndicator}}" product="{{item}}" indicators="{{indicators}}" opened="{{indicatorViewOpened}}" loading="{{loading}}" route="{{subroute}}" route-data="{{routeData}}" visible="{{visible}}"></slr-indicator-view>

    <paper-dialog id="deleteModal" opened="{{deleteModalOpened}}">
      <h2>Delete Product</h2>
      <p>Are you sure you want to delete "{{item.name}}"?</p>
      <div class="buttons">
        <paper-button dialog-dismiss="">Cancel</paper-button>
        <paper-button dialog-confirm="" on-click="deleteConfirm">Delete</paper-button>
      </div></paper-dialog>

    <slr-dialog id="productModal" title="Product" item="{{item}}" opened="{{opened}}" edit-mode="{{editMode}}" loading="{{loading}}" trigger-events="">

      <div slot="close">
        <paper-icon-button icon="close" title="close" on-click="close"></paper-icon-button>
      </div>

      <div slot="toolbar" hidden="{{!editMode}}">
        <paper-icon-button icon="delete" hidden\$="{{!item.uri}}" on-click="delete"></paper-icon-button>
      </div>

      <div slot="actions" hidden\$="{{!editMode}}">
        <paper-button on-click="cancel">Cancel</paper-button>
        <paper-button on-click="submit" autofocus="">Save</paper-button>
      </div>


      <div class="container flex-vertical" small-layout\$="[[small]]">
        <slr-form id="form" loading="{{loading}}" item="{{item}}">
          <form method="[[method]]" action="[[action]]">

            <div class="inputs">
              <paper-input id="name" type="text" name="name" label="Name" always-float-label="" autofocus="true" disabled="[[!editMode]]" value="{{item.name}}" required=""></paper-input>
                <paper-dropdown-menu id="productGroup" name="product_group_uri" class="paper-dropdown" label="Product Group" value="{{productGroupUri}}" disabled="[[!editMode]]" searchable="true" persist-on-close="true" required="" search-text="{{productGroupsSearch}}">
                    <template is="dom-repeat" items="{{productGroups}}" as="pg">
                      <paper-item value\$="{{pg.uri}}">{{pg.name}}</paper-item>
                    </template>
                </paper-dropdown-menu>
              <paper-input id="email" type="email" name="email" label="Notifications Email" always-float-label="" disabled="[[!editMode]]" value="{{item.email}}" auto-validate="">
                  <iron-icon slot="prefix" icon="mail"></iron-icon>
              </paper-input>
            </div>

            <div class="lists">
              <div class="column" hidden\$="[[!item.uri]]" small-layout\$="[[small]]">
                <div>
                  <iron-label>Objectives</iron-label>
                  <paper-icon-button icon="add" hidden\$="[[!editMode]]" on-click="addObjective"></paper-icon-button>
                </div>
                <paper-dialog-scrollable>
                  <paper-listbox id="objectivesList" disabled\$="[[!objectives.length]]">
                    <template is="dom-repeat" items="{{objectives}}" as="objective">
                      <a href="/products/[[item.slug]]/slo/[[objective.id]]" on-click="openObjectiveView">
                        <paper-item>{{objective.title}}</paper-item>
                      </a>
                    </template>
                    <paper-item disabled="" class="no-items" hidden="[[objectives.length]]">No objectives...</paper-item>
                  </paper-listbox>
                </paper-dialog-scrollable>
              </div>

              <div class="column" hidden\$="[[!item.uri]]" small-layout\$="[[small]]">
                <div>
                  <iron-label>Indicators</iron-label>
                  <paper-icon-button icon="add" hidden\$="[[!editMode]]" on-click="addIndicator"></paper-icon-button>
                </div>

                <paper-dialog-scrollable>
                  <paper-listbox id="indicatorsList" disabled\$="[[!indicators.length]]">
                    <template is="dom-repeat" items="{{indicators}}" as="indicator">
                      <a href="/products/[[item.slug]]/sli/[[indicator.name]]" on-click="openIndicatorView">
                        <paper-item>{{indicator.name}}</paper-item>
                      </a>
                    </template>
                    <paper-item disabled="" class="no-items" hidden="[[indicators.length]]">No indicators...</paper-item>
                  </paper-listbox>
                </paper-dialog-scrollable>
              </div>
            </div>

          </form>
        </slr-form>
      </div>
    </slr-dialog>
`;
  }

  static get is() { return 'slr-product-view' }

  static get properties() {
    return {
      item: {
        type: Object,
        notify: true,
        observer: 'itemChanged'
      },
      slug: {
        type: String
      },
      params: {
        type: Object,
        computed: 'computeParams(slug)'
      },
      productGroups: {
        type: Array,
        observer: 'productGroupsChanged',
        value: () => []
      },
      productGroupUri: {
        type: String
      },
      productGroupsSearch: {
        type: String,
        notify: true
      },
      objectives: {
        type: Array,
        value: () => []
      },
      indicators: {
        type: Array,
        value: () => []
      },
      route: {
        type: Object
      },
      routeData: {
        type: Object,
        notify: true
      },
      visible: {
        type: Boolean
      },
      opened: {
        type: Boolean,
        value: false,
        notify: true,
        observer: 'openedChanged'
      },
      objectiveViewOpened: {
        type: Boolean
      },
      loading: {
        type: Boolean,
        notify: true
      },
      editMode: {
        type: Boolean,
        value: false,
        notify: true
      },
      method: {
        type: String,
        value: 'POST'
      },
      action: {
        type: String,
        value: '/api/products',
        computed: 'computeAction(item.uri)'
      },
      headers: {
        type: Object,
        value: {
          'content-type': 'application/json'
        }
      },
      indicatorViewOpened: {
        type: Boolean,
        value: false
      },
      indicatorViewEditMode: {
        type: Boolean,
        value: false
      },
      selectedProductGroup: {
        type: Object
      },
      selectedObjective: {
        type: Object,
      },
      selectedIndicator: {
        type: Object
      },
      objectiveViewOpened: {
        type: Boolean
      },
      deleteModalOpened: {
        type: Boolean,
        value: false
      }
    }
  }

  computeAction(uri) {
    return uri ? uri : '/api/products'
  }

  computeParams(slug) {
    return {
      name: slug
    }
  }

  openedChanged(opened) {
    // update list of product groups when view is opened
    if (this.opened) {
      this.$.productGroupsData.resetCol()
    }
  }

  static get observers() {
    return [ 'routeDataChanged(routeData.slug, visible)' ]
  }

  routeDataChanged(slug, visible)  {
    if (slug && visible && this.route.prefix === '/products' && this.route.path) {
      this.set('slug', slug)
      this.$.productAjax.generateRequest()
    }
  }

  productGroupsChanged() {
    // re-set product group uri after collection updates
    // solves issue when searching for a product group and canceling after
    this.set('productGroupUri', this.item.product_group_uri)
  }

  itemChanged() {
    this.set('productGroupUri', this.item.product_group_uri)
  }

  ready() {
    super.ready()
    this.$.productModal.addEventListener('slr-dialog-closed', (e) => this.onClose(e))
    this.$.form.addEventListener('iron-form-error', (e) => this.onError(e))
    this.$.form.addEventListener('iron-form-response', (e) => this.onResponse(e))
    this.$.objectiveView.addEventListener('slr-objective-submitted', (e) => this.onObjectiveSubmit(e))
    this.$.indicatorView.addEventListener('slr-indicator-submitted', (e) => this.onIndicatorSubmit(e))
    this.$.productGroupsData.addEventListener('items-data-error', (e) => this.onProductGroupsDataError(e))
    this.$.objectivesData.addEventListener('items-data-error', (e) => this.onObjectivesDataError(e))
    this.$.indicatorsData.addEventListener('items-data-error', (e) => this.onIndicatorsDataError(e))
  }

  handleProductResponse(e) {
    let item = e.detail.response.data.pop()
    this.set('item', item)
    this.set('opened', true)
    this.set('routeData.slug', item.slug)
  }

  handleProductErrorResponse(e) {
    let action = () => { this.$.productAjax.generateRequest() }
    this.notify("Can't load Product", action)
  }

  handleProductGroupResponse(e) {
    let r = e.detail.response
    let present = this.productGroups.find((pg) => { return pg.slug === r.slug })
    if (!present) {
      this.push('productGroups', r)
    }
  }

  handleProductGroupErrorResponse(e) {
    let action = () => { this.$.productGroupAjax.generateRequest() }
    this.notify("Can't load Product Group", action)
  }

  onClose(e) {
    this.set('routeData.slug', null)
    this.initForm()
  }

  onError(e) {
    let method = this.$.form.request.method || 'default'
    let m = { 'POST': 'add', 'PUT': 'update', 'DELETE': 'delete', 'default': 'save' }

    try {
      if (e.detail.request.xhr.response.status === 401) {
        this.dispatchEvent(new CustomEvent('slr-authenticate', {bubbles: true, composed: true}))
      } else {
        this.notify(`Can't ${m[method]} Product.`,
          () => this.$.form.submit(),
          e.detail.request.xhr.response.detail)
      }
    } catch(e) {
      this.notify(`Can't ${m[method]} Product.`,
        () => this.$.form.submit())
    }

    this.initForm()
  }

  onResponse(e) {
    let m = { 'POST': 'Added', 'PUT': 'Updated', 'DELETE': 'Deleted' }
    let method = this.$.form.request.method
    let newItem = e.detail.response
    let oldItem = this.item

    this.set('editMode', false)

    if (method === 'POST' || method === 'PUT') {
      let action = method === 'POST' ? 'add' : 'update'
      this.dispatchEvent(new CustomEvent('product-' + action,
        { detail: { item: newItem, old_slug: oldItem.slug },
          bubbles: true, composed: true }))
      this.set('routeData.slug', newItem.slug)
    }

    if (method === 'DELETE') {
      this.dispatchEvent(new CustomEvent('product-delete',
        { detail: { item: oldItem },
          bubbles: true, composed: true }))
      this.set('opened', false)
      this.set('routeData.slug', null)
    }

    this.notify(`${m[method]} Product.`)
    this.initForm()
  }

  onObjectiveSubmit(e) {
    this.$.objectivesData.resetCol()
  }

  onIndicatorSubmit(e) {
    this.$.indicatorsData.resetCol()
  }

  onProductGroupsDataError(e) {
    let message = e.detail.message
    let action = () => { this.$.productGroupsData.fetch() }
    this.notify("Can't load Product Groups", action, message)
  }

  onObjectivesDataError(e) {
    let message = e.detail.message
    let action = () => { this.$.objectivesData.fetch() }
    this.notify("Can't load Objectives", action, message)
  }

  onIndicatorsDataError(e) {
    let message = e.detail.message
    let action = () => { this.$.indicatorsData.fetch() }
    this.notify("Can't load Indicators", action, message)
  }

  fetchData() {
    if (this.item.product_slo_uri) {
      this.$.objectivesData.fetch()
    }

    if (this.item.product_sli_uri) {
      this.$.indicatorsData.fetch()
    }
  }

  initForm() {
    this.set('method', 'POST')
    this.set('action', '/api/products')
    this.set('productGroupsSearch', '')
    this.$.form.reset()
  }

  cancel() {
    if (!this.item.uri) {
      this.set('opened', false)
    }
    this.set('editMode', false)
    this.$.productModal.reset()
    this.initForm()
    this.dispatchEvent(new CustomEvent('product-cancel',
      { detail: { item: this.item }, bubbles: true, composed: true })
    )
  }

  submit() {
    if (!this.$.form.validate()) {
      return
    }
    this.$.form.submit()
  }

  open() {
    this.set('opened', true)
  }

  openObjectiveView(e) {
    this.set('selectedObjective', e.model.objective)
    this.$.objectiveView.open()
  }

  openIndicatorView(e) {
    this.set('selectedIndicator', e.model.indicator)
    this.$.indicatorView.open()
  }

  addObjective() {
    this.set('selectedObjective', {})
    this.$.objectiveView.new()
  }

  addIndicator() {
    this.set('selectedIndicator', { "source": {} })
    this.$.indicatorView.new()
  }

  delete() {
    this.set('deleteModalOpened', true)
  }

  deleteConfirm() {
    this.set('method', 'DELETE')
    this.$.form.submit()
  }

  reset() {
    this.set('item', {})
    this.set('objectives', [])
    this.set('indicators', [])
  }

  new() {
    this.reset()
    this.set('opened', true)
    this.set('editMode', true)
  }

  close() {
    if (!this.item.name) {
      this.cancel()
    }
    this.set('opened', false)
    this.reset()
  }

  notify(message, action, detail, duration = 5000) {
    this.dispatchEvent(
      new CustomEvent('slr-notify', {
        detail: { message, action, duration, detail },
        bubbles: true,
        composed: true
      })
    )
  }
}

window.customElements.define(SlrProductView.is, SlrProductView)
