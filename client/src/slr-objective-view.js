import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-input/paper-input.js';
import '@polymer/iron-label/iron-label.js';
import '@polymer/paper-icon-button/paper-icon-button.js';
import './slr-form.js';
import './slr-dialog.js';
import './slr-target.js';
import './slr-ajax.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
class SlrObjectiveView extends PolymerElement {
  static get template() {
    return html`
    <style include="common-styles">
      :host {
        display: block;
        @apply --slr-content;
        text-align: left;
      }

      paper-listbox {
        padding: 0;
      }

      paper-dialog-scrollable {
        margin-top: 10px;
        flex: 1;
      }

      .container {
        @apply --layout-vertical;
        flex: 1;
      }

      .targets {
        @apply --layout-vertical;
        flex: 1;
      }

    </style>

    <slr-ajax id="ajax" url="[[item.uri]]" handle-as="json" on-response="handleResponse" on-error="handleErrorResponse" debounce-duration="300" loading="{{loading}}"></slr-ajax>

    <paper-dialog id="deleteModal" opened="{{deleteModalOpened}}">
      <h2>Delete Objective</h2>
      <p>Are you sure you want to delete "{{item.title}}"?</p>
      <div class="buttons">
        <paper-button dialog-dismiss="">Cancel</paper-button>
        <paper-button dialog-confirm="" on-click="deleteConfirm">Delete</paper-button>
      </div></paper-dialog>

    <slr-dialog id="objectiveModal" title="Objective" item="{{item}}" opened="{{opened}}" edit-mode="{{editMode}}" loading="{{loading}}">
      <div slot="close">
        <paper-icon-button icon="arrow-back" title="back" on-click="close"></paper-icon-button>
      </div>
      <div slot="toolbar" hidden="[[!editMode]]">
        <paper-icon-button icon="delete" hidden\$="[[!item.uri]]" on-click="delete"></paper-icon-button>
      </div>
      <div slot="actions" hidden\$="[[!editMode]]">
        <paper-button on-click="cancel">Cancel</paper-button>
        <paper-button on-click="submit" autofocus="">Save</paper-button>
      </div>

      <div class="container">
        <slr-form id="form" loading="{{loading}}" item="{{item}}">
          <form class="form" method="[[method]]" action="[[action]]">
            <paper-input type="text" id="title" name="title" label="Title" always-float-label="" autofocus="true" disabled="[[!editMode]]" value="{{item.title}}" required=""></paper-input>
            <paper-input type="text" id="description" name="description" label="Description" always-float-label="" disabled="[[!editMode]]" value="{{item.description}}" required=""></paper-input>
          </form>
        </slr-form>
          <div class="targets" hidden\$="[[!item.uri]]">
            <div>
              <iron-label>Targets</iron-label>
              <paper-icon-button icon="add" title="Add Target" hidden\$="[[!editMode]]" on-click="addTarget">
              </paper-icon-button>
            </div>
            <paper-dialog-scrollable>
              <ul>
                <template is="dom-repeat" items="{{targets}}" as="target">
                  <li>
                    <slr-target class="target" uri="{{target.uri}}" objective="[[item]]" indicators="[[indicators]]" edit-mode="[[editMode]]" loading="{{loading}}" hidden\$="{{target.hidden}}" ignore\$="{{target.ignore}}">
                        <div slot="actions">
                            <paper-icon-button icon="delete" hidden\$="[[!editMode]]" on-click="hideTargetToDelete"></paper-icon-button>
                        </div>
                    </slr-target>
                  </li>
                </template>
                <li hidden="[[targets.length]]">
                  <p class="no-items">No targets...</p>
                </li>
              </ul>
            </paper-dialog-scrollable>
          </div>
      </div>
    </slr-dialog>
`;
  }

  static get is() { return 'slr-objective-view' }

  static get properties() {
    return {
      product: {
        type: Object,
        value: () => {}
      },
      objectives: {
        type: Array,
        value: () => []
      },
      indicators: {
        type: Array,
        value: () => []
      },
      item: {
        type: Object,
        value: () => {}
      },
      targets: {
        type: Array,
        value: () => [],
        computed: 'computeTargets(item.targets)'
      },
      opened: {
        type: Boolean,
        notify: true
      },
      editMode: {
        type: Boolean,
        value: false
      },
      method: {
        type: String,
        value: 'POST'
      },
      action: {
        type: String,
        computed: 'computeAction(item.uri, product.uri)'
      },
      headers: {
        type: Object,
        value: {
          'content-type': 'application/json'
        }
      },
      loading: {
        type: Boolean,
        value: false,
        notify: true
      },
      route: {
        type: Object
      },
      routeData: {
        type: Object
      },
      visible: {
        type: Boolean
      },
      deleteModalOpened: {
        type: Boolean,
        value: false
      }
    }
  }

  computeAction(itemUri, productUri) {
    return itemUri ? itemUri : productUri + '/slo'
  }

  computeTargets(targets = []) {
    return targets.map((uri) => { return { uri } })
  }

  ready() {
    super.ready()
    this.$.objectiveModal.addEventListener('slr-dialog-closed', (e) => this.onClosed(e))
    this.$.form.addEventListener('iron-form-error', (e) => this.onError(e))
    this.$.form.addEventListener('iron-form-response', (e) => this.onResponse(e))
  }

  onClosed(e) {
    this.set('routeData.objectiveId', null)
    this.initForm()
  }

  onError(e) {
    let method = this.$.form.request.method || 'default'
    let m = {
      'POST': 'add',
      'PUT': 'update',
      'DELETE': 'delete',
      'default': 'save'
    }

    try {
      if (e.detail.request.xhr.response.status === 401) {
        this.dispatchEvent(new CustomEvent('slr-authenticate',
        {bubbles: true, composed: true}))
      } else {
        this.notify(`Can't ${m[method]} Objective.`,
          () => this.$.form.submit(),
          e.detail.request.xhr.response.detail)
      }
    } catch(e) {
      this.notify(`Can't ${m[method]} Objective.`,
        () => this.$.form.submit())
    }

    this.initForm()
  }

  onResponse(e) {
    this.dispatchEvent(new CustomEvent('slr-objective-submitted',
      { detail: { item: e.detail.response }, bubble:true, composed: true })
    )

    let method = this.$.form.request.method || 'default'
    let m = {
      'POST': 'Added',
      'PUT': 'Updated',
      'DELETE': 'Deleted',
      'default': 'Saved'
    }

    this.dispatchEvent(new CustomEvent('slr-notify', {
        detail: { message: `${m[method]} Objective.` },
        bubbles: true,
        composed: true
      })
    )

    this.initForm()

    if (method === 'DELETE') {
      this.set('opened', false)
    } else {
      this.set('editMode', false)
      this.set('item', e.detail.response)
    }
  }

  validateAllTargets() {
    let valid = true
    this.shadowRoot.querySelectorAll('.target:not([hidden])')
      .forEach( (t) => valid = t.validate() && valid )
    return valid
  }

  submitAllTargets(cb) {
    let requests = []
    this.shadowRoot.querySelectorAll('.target[hidden]')
      .forEach( (t) => t.$.ajax.method = 'DELETE' )
    this.shadowRoot.querySelectorAll('.target:not([ignore])')
      .forEach( (t) => requests.push(t.submit()) )
    return requests
  }

  submit(e) {
    if (!this.$.form.validate() || !this.validateAllTargets()) {
      return
    }
    Promise
      .all(this.submitAllTargets())
      .then(() => this.$.form.submit())
  }

  new() {
    this.set('opened', true)
    this.set('editMode', true)
  }

  addTarget() {
    this.push('targets', { uri: null })
  }

  open() {
    this.set('opened', true)
  }

  close() {
    this.set('opened', false)
  }

  cancel() {
    if (!this.item.uri) {
      this.set('opened', false)
    }

    this.set('editMode', false)
    this.$.objectiveModal.reset()
    this.initForm()

    let slrTargets = (this.shadowRoot.querySelectorAll('slr-target'))
    slrTargets.forEach((t) => {
      t.reset()
    })

    this.$.ajax.generateRequest()
  }

  initForm() {
    this.set('method', 'POST')
    this.set('action', '/api/products')
    this.$.form.reset()
  }

  delete() {
    this.set('deleteModalOpened', true)
  }

  deleteConfirm() {
    this.set('method', 'DELETE')
    this.$.form.submit()
  }

  hideTargetToDelete(e) {
    let i = e.model.index
    this.set('targets.'+i+'.hidden', true)
    if (!this.targets[i].uri) {
      this.set('targets.'+i+'.ignore', true)
    }
  }

  handleResponse(e) {
    try {
      this.set('item', e.detail.response)
    } catch(e) {
      console.error('Error loading Objective')
      this.notify("Can't Load Objective", () => this.$.ajax.generateRequest())
    }
  }

  handleErrorResponse(e) {
    try {
      this.notify("Can't Load Objective.",
        () => this.$.ajax.generateRequest(),
        e.detail.request.xhr.response.detail)
    } catch(e) {
      this.notify("Can't Load Objective.",
        () => this.$.ajax.generateRequest(),
        "Can't parse Server response")
    }
  }

  notify(message, action, detail, duration = 5000) {
    this.dispatchEvent(
      new CustomEvent('slr-notify', {
        detail: { message, action, detail, duration },
        bubbles: true,
        composed: true
      })
    )
  }
}
window.customElements.define(SlrObjectiveView.is, SlrObjectiveView)
