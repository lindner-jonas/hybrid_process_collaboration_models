import ConstraintFlowState from './ConstraintFlowState';
import DeclarativeConstraint from './DeclarativeConstraint';

export default function ConstraintPaletteProvider(palette, create, elementFactory, translate, moddle, connect, globalConnect) {

  this._create = create;
  this._elementFactory = elementFactory;
  this._translate = translate;
  this._moddle = moddle;
  this._connect = connect;
  this._globalConnect = globalConnect;

  palette.registerProvider(this);
}

ConstraintPaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'translate',
  'moddle',
  'connect',
  'globalConnect'
];

ConstraintPaletteProvider.prototype.getPaletteEntries = function() {

  const self = this;

  return {
    'constraint-flow-tool': {
      group: 'connect',
      className: 'bpmn-icon-gateway-xor',
      title: 'Constraint flow',
      action: {
        click: function(event) {
          ConstraintFlowState.constraintFlowType = DeclarativeConstraint.RESPONSE;
          self._globalConnect.start(event);
        }
      }
    }
  };
};
