import ConstraintPaletteProvider from './ConstraintPaletteProvider';
import ConstraintRenderer from './ConstraintRenderer';
import ConstraintRules from './ConstraintRules';
import ConstraintConnectionHandler from './ConstraintConnectionHandler';
import ConstraintPropertiesProvider from './ConstraintPropertiesProvider';
// import './ConstraintFlowTestHelper'; // Load test helper functions

export default {
  __init__: [
    'constraintPaletteProvider',
    'constraintRenderer',
    'constraintRules',
    'constraintConnectionHandler',
    'constraintPropertiesProvider'
  ],
  constraintPaletteProvider: [ 'type', ConstraintPaletteProvider ],
  constraintRenderer: [ 'type', ConstraintRenderer ],
  constraintRules: [ 'type', ConstraintRules ],
  constraintConnectionHandler: [ 'type', ConstraintConnectionHandler ],
  constraintPropertiesProvider: [ 'type', ConstraintPropertiesProvider ],
};
