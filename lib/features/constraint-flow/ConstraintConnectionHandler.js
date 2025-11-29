import ConstraintFlowState from './ConstraintFlowState';

export default function ConstraintConnectionHandler(eventBus, moddle, elementFactory) {

  const originalCreateConnection = elementFactory.createConnection;
  elementFactory.createConnection = function(attrs, ...rest) {
    if (ConstraintFlowState.constraintFlowType && !attrs.type) {
      attrs.type = 'constraint:ConstraintFlow';
    }
    return originalCreateConnection.call(this, attrs, ...rest);
  };

  eventBus.on('commandStack.connection.create.preExecute', function(event) {

    const context = event.context;
    const { source, target, connection } = context;

    // Check for our custom flag
    if (ConstraintFlowState.constraintFlowType) {
      connection.businessObject = moddle.create('constraint:ConstraintFlow', {
        id: connection.id,
        constraintType: ConstraintFlowState.constraintFlowType,
        sourceRef: source.businessObject,
        targetRef: target.businessObject,
      });
      connection.type = 'constraint:ConstraintFlow';
      ConstraintFlowState.constraintFlowType = null;
    }
  });

  eventBus.on('connect.ended', function() {
    ConstraintFlowState.constraintFlowType = null;
  });

  eventBus.on('connect.canceled', function() {
    ConstraintFlowState.constraintFlowType = null;
  });
}

ConstraintConnectionHandler.$inject = [ 'eventBus', 'moddle', 'elementFactory' ];