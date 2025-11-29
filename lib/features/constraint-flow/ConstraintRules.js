
import inherits from 'inherits-browser';
import ConstraintFlowState from './ConstraintFlowState';
import RuleProvider from 'diagram-js/lib/features/rules/RuleProvider';

export default function ConstraintRules(eventBus, elementRegistry) {
  console.log('ConstraintRules loaded');
  RuleProvider.call(this, eventBus);
  this._elementRegistry = elementRegistry;
}

inherits(ConstraintRules, RuleProvider);

ConstraintRules.$inject = [ 'eventBus', 'elementRegistry' ];


ConstraintRules.prototype.init = function() {

  this.addRule('connection.start', 1500, (context) => {
    if (ConstraintFlowState.constraintFlowType) {
      const { source } = context;
      return source && source.type && (
        source.type.includes('Activity') || source.type.includes('Task')
      );
    }
  });

  this.addRule('connection.create', 1500, (context) => {
    if (ConstraintFlowState.constraintFlowType) {
      const { source, target } = context;
      if (
        source && target &&
        source.type && target.type &&
        (
          source.type.includes('Activity') || source.type.includes('Task')
        ) &&
        (
          target.type.includes('Activity') || target.type.includes('Task')
        )
      ) {
        const elementRegistry = this._elementRegistry;
        const getParticipant = (element) => {
          let current = element;
          while (current) {
            if (current.type === 'bpmn:Participant') {
              return current;
            }
            current = elementRegistry.get(current.parent && current.parent.id);
          }
          return null;
        };
        const sourcePool = getParticipant(source);
        const targetPool = getParticipant(target);

        // Only allow if both have pools and are different
        return sourcePool && targetPool && sourcePool.id !== targetPool.id;
      }
      return false;
    }
  });

};