import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/iron-media-query/iron-media-query.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-dialog/paper-dialog.js';
import '@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-fab/paper-fab.js';
import '@polymer/iron-icons/iron-icons.js';
import '@polymer/paper-spinner/paper-spinner-lite.js';
import '@polymer/iron-flex-layout/iron-flex-layout.js';
import '@polymer/neon-animation/animations/scale-up-animation.js';
import '@polymer/neon-animation/animations/fade-out-animation.js';
import './common-styles.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
class SlrDialog extends PolymerElement {
  static get template() {
    return html`
    <style include="common-styles">
      :host {
        display: block;
        @apply --slr-content;
        text-align: left;
        --paper-input-container-disabled: {
          opacity: 0.66;
        };
      }

      paper-dialog {
        max-width: var(--app-content-max-width);
        min-width: 500px;
        position: fixed;
        top: 12vh;
        bottom: 20vh;
        left: 15vw;
        right: 15vw;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      paper-dialog[small-layout] {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: 0;
        padding: 0;
        min-width: 300px;
      }

      app-toolbar {
        margin-top: 0;
        padding: 0 10px;
        background-color: var(--app-secondary-color);
      }

      .flex-horizontal {
        @apply --layout-horizontal;
        @apply --layout-wrap;
      }

      .flex-vertical {
        @apply --layout-vertical;
      }

      .flex-equal-justified {
        @apply --layout-horizontal;
        @apply --layout-justified;
      }

      .flexchild-vertical {
        @apply --layout-flex;
        overflow: hidden;
      }

      paper-fab {
        margin-top: 60px;
        margin-right: 5%;
        z-index: 1;
      }

      .spinner {
        width: 100px;
        text-align: center;
      }

      paper-spinner-lite.orange {
        --paper-spinner-color: var(--app-accent-color);
      }
    </style>

    <iron-media-query query="(max-width: 600px)" query-matches="{{small}}"></iron-media-query>

    <paper-dialog small-layout\$="{{small}}" id="dialog" opened="{{opened}}" class="flex-vertical" entry-animation="fade-in-animation" exit-animation="fade-out-animation" no-cancel-on-outside-click="{{editMode}}" no-cancel-on-esc-key="{{editMode}}" on-iron-overlay-opened="_disableDocumentScrolling" on-iron-overlay-closed="_restoreDocumentScrolling">

      <app-toolbar class="flex-horizontal flex-equal-justified">
        <slot name="close"></slot>
        <div class="flexchild-vertical">{{title}}</div>
        <paper-fab icon="create" title="edit" on-click="toggleEditMode" hidden\$="{{editMode}}" mini=""></paper-fab>
          <div hidden="{{!loading}}">
            <div id="spinner" class="spinner" hidden\$="{{!editMode}}">
              <paper-spinner-lite class="orange" active=""></paper-spinner-lite>
            </div>
          </div>
          <slot name="toolbar"></slot>
      </app-toolbar>

      <slot></slot>

      <div class="buttons" hidden\$="{{loading}}">
        <slot name="actions"></slot>
      </div>
    </paper-dialog>
`;
  }

  static get is() { return 'slr-dialog' }

  static get properties() {
    return {
      title: {
        type: String
      },
      icon: {
        type: String,
        value: 'close'
      },
      item: {
        type: Object,
        notify: true,
        value: () => {},
        observer: 'itemChanged'
      },
      // save copy to reset form since iron-form
      // and paper-input have issues
      _item: {
        type: Object,
        value: () => {}
      },
      opened: {
        type: Boolean,
        value: false,
        observer: 'openedChanged',
        notify: true
      },
      editMode: {
        type: Boolean,
        notify: true
      },
      loading: {
        type: Boolean,
        value: false
      },
      triggerEvents: {
        type: Boolean,
        value: false,
        reflectToAttribute: true
      }
    }
  }

  static get observers() {
    return [ 'itemPropsChanged(item.slo, item.sli)' ]
  }

  openedChanged(opened) {
    if (opened) {
      return this.whenOpened()
    }
    this.whenClosed()
  }

  whenOpened() {
    this.copyItem()
    this.reset()
    if (this.triggerEvents) {
      this.dispatchEvent(new CustomEvent('slr-dialog-opened',
        { bubble:true, composed: true }))
    }
  }

  whenClosed() {
    this.reset()
    this.set('editMode', false)
    if (this.triggerEvents) {
      this.dispatchEvent(new CustomEvent('slr-dialog-closed',
        { bubble:true, composed: true }))
    }
  }

  itemChanged() {
    this.copyItem()
  }

  itemPropsChanged(obj) {
    this.copyItem()
  }

  toggleEditMode() {
    this.set('editMode', !this.editMode)
  }

  reset() {
    this.set('item', Object.assign({}, this._item))
  }

  copyItem() {
    this.set('_item', Object.assign({}, this.item))
  }

  _disableDocumentScrolling(e) {
    document.body.style.overflow = 'hidden';
  }

  _restoreDocumentScrolling(e) {
    document.body.style.overflow = '';
  }
}

window.customElements.define(SlrDialog.is, SlrDialog)
