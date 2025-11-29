import { SelectEntry, ListEntry, TextFieldEntry } from '@bpmn-io/properties-panel';
import DeclarativeConstraint from './DeclarativeConstraint';

export default function ConstraintPropertiesProvider(propertiesPanel, modeling, elementRegistry, bpmnFactory, eventBus) {
  propertiesPanel.registerProvider(500, this);
  this._modeling = modeling;
  this._elementRegistry = elementRegistry;
  this._bpmnFactory = bpmnFactory;
  this._eventBus = eventBus;
}

ConstraintPropertiesProvider.$inject = [ 'propertiesPanel', 'modeling', 'elementRegistry', 'bpmnFactory', 'eventBus' ];

ConstraintPropertiesProvider.prototype.getGroups = function(element) {
  const modeling = this._modeling;
  const elementRegistry = this._elementRegistry;
  const bpmnFactory = this._bpmnFactory;
  const eventBus = this._eventBus;

  return (groups) => {
    // Add constraint type selection for constraint flows
    if (element.type === 'constraint:ConstraintFlow') {
      groups.push({
        id: 'constraint',
        label: 'Constraint',
        entries: [
          {
            id: 'constraintType',
            component: (props) => ConstraintFlowTypeEntry({ ...props, modeling })
          }
        ]
      });
    }

    // Add constraint management for collaboration (process level)
    if (element.type === 'bpmn:Collaboration' || element.type === 'bpmn:Process') {
      groups.push({
        id: 'constraintManagement',
        label: 'Constraint Management',
        entries: [
          {
            id: 'existingConstraints',
            component: (props) => ExistingConstraintsEntry({ ...props, elementRegistry, modeling, bpmnFactory, eventBus })
          },
          {
            id: 'constraintTypeSelect',
            component: (props) => ConstraintTypeSelectEntry({ ...props, elementRegistry, modeling, bpmnFactory, eventBus })
          },
          {
            id: 'sourceActivitySelect',
            component: (props) => SourceActivitySelectEntry({ ...props, elementRegistry })
          },
          {
            id: 'targetActivitySelect',
            component: (props) => TargetActivitySelectEntry({ ...props, elementRegistry })
          },
          // removed pseudo-button entry; use ListEntry onAdd instead
        ]
      });
    }

    return groups;
  };
};

// Global state for form
let formState = {
  constraintType: '',
  sourceActivity: '',
  targetActivity: ''
};

function ConstraintFlowTypeEntry(props) {
  const { element, modeling } = props;

  const options = [
    { value: '', label: 'Select type' },
    ...Object.values(DeclarativeConstraint).map(value => ({
      value,
      label: value
    }))
  ];

  return SelectEntry({
    element,
    id: 'constraintType',
    label: 'Constraint Type',
    getValue: () => element.businessObject.constraintType || '',
    setValue: value => {
      modeling.updateProperties(element, { constraintType: value });
    },
    getOptions: () => options
  });
}

function ExistingConstraintsEntry(props) {
  const { element, elementRegistry, modeling, bpmnFactory, eventBus } = props;

  // Bind creation function with required services
  const createConstraint = createConstraintFactory(elementRegistry, modeling, bpmnFactory, eventBus);

  const getExistingConstraints = () => {
    const constraints = [];
    const elements = elementRegistry.getAll();

    elements.forEach(el => {
      if (el.businessObject && el.businessObject.$type === 'constraint:ConstraintFlow') {
        const bo = el.businessObject;

        let sourceName = 'Unknown';
        let targetName = 'Unknown';

        try {
          if (bo.sourceRef) {
            sourceName = bo.sourceRef.name || bo.sourceRef.id || bo.sourceActivity || 'Unknown';
          } else if (bo.sourceActivity) {
            const sourceElement = elementRegistry.get(bo.sourceActivity);
            sourceName = sourceElement ? (sourceElement.businessObject.name || sourceElement.id) : bo.sourceActivity;
          }

          if (bo.targetRef) {
            targetName = bo.targetRef.name || bo.targetRef.id || bo.targetActivity || 'Unknown';
          } else if (bo.targetActivity) {
            const targetElement = elementRegistry.get(bo.targetActivity);
            targetName = targetElement ? (targetElement.businessObject.name || targetElement.id) : bo.targetActivity;
          }
        } catch (error) {
          console.warn('[ConstraintPropertiesProvider] Error getting constraint names:', error);
        }

        const unaryConstraints = ['existence', 'absence2'];
        const isUnary = unaryConstraints.includes(bo.constraintType);
        const activitiesText = isUnary ? sourceName : `${sourceName} → ${targetName}`;

        constraints.push({
          id: el.id,
          label: `${bo.constraintType || 'unknown'}: ${activitiesText}`,
          element: el
        });
      }
    });

    return constraints;
  };

  return ListEntry({
    element,
    id: 'existingConstraints',
    label: 'Existing Constraints',
    items: getExistingConstraints(),
    onAdd: () => {
      // delegate create using current form state
      createConstraint();
    },
    onRemove: (item) => {
      try {
        const constraint = elementRegistry.get(item.id);
        if (constraint) {
          modeling.removeConnection(constraint);
        }
      } catch (error) {
        console.error('Error deleting constraint:', error);
      }
    }
  });
}

function ConstraintTypeSelectEntry(props) {
  const { element, elementRegistry, modeling, bpmnFactory, eventBus } = props;

  const constraintTypeOptions = [
    { value: '', label: 'Select constraint type...' },
    { value: 'existence', label: 'Existence' },
    { value: 'absence2', label: 'Absence2' },
    { value: 'choice', label: 'Choice' },
    { value: 'resp-existence', label: 'Response Existence' },
    { value: 'coexistence', label: 'Co-existence' },
    { value: 'response', label: 'Response' },
    { value: 'precedence', label: 'Precedence' },
    { value: 'succession', label: 'Succession' },
    { value: 'alt-response', label: 'Alternating Response' },
    { value: 'alt-precedence', label: 'Alternating Precedence' },
    { value: 'chain-response', label: 'Chain Response' },
    { value: 'chain-precedence', label: 'Chain Precedence' },
    { value: 'chain-succession', label: 'Chain Succession' },
    { value: 'not-coexistence', label: 'Not Co-existence' },
    { value: 'neg-succession', label: 'Not Succession' },
    { value: 'neg-chain-succession', label: 'Not Chain Succession' }
  ];

  return SelectEntry({
    element,
    id: 'newConstraintType',
    label: 'New Constraint Type',
    getValue: () => element.businessObject.tmpConstraintType || '',
    setValue: (value) => {
      // persist selection on the element so panel detects changes immediately
      modeling.updateProperties(element, { tmpConstraintType: value, tmpSourceActivity: ['existence','absence2'].includes(value) ? '' : (element.businessObject.tmpSourceActivity || '') });
    },
    getOptions: () => constraintTypeOptions
  });
}

function SourceActivitySelectEntry(props) {
  const { element, elementRegistry, modeling } = props;

  const getActivities = () => {
    const activities = [];
    const elements = elementRegistry.getAll();

    elements.forEach(el => {
      if (el.businessObject &&
        (el.businessObject.$type === 'bpmn:Task' ||
          el.businessObject.$type === 'bpmn:UserTask' ||
          el.businessObject.$type === 'bpmn:ServiceTask' ||
          el.businessObject.$type === 'bpmn:ManualTask' ||
          el.businessObject.$type === 'bpmn:ScriptTask' ||
          el.businessObject.$type === 'bpmn:BusinessRuleTask' ||
          el.businessObject.$type === 'bpmn:SendTask' ||
          el.businessObject.$type === 'bpmn:ReceiveTask')) {

        const activityName = el.businessObject.name || el.id;
        activities.push({
          value: el.id,
          label: activityName
        });
      }
    });

    return [{ value: '', label: 'Select source activity...' }, ...activities.sort((a, b) => a.label.localeCompare(b.label))];
  };

  // Only show for binary constraints - return disabled field instead of null
  const currentType = element.businessObject.tmpConstraintType || '';
  const showField = currentType && !['existence', 'absence2'].includes(currentType);

  return SelectEntry({
    element,
    id: 'newSourceActivity',
    label: 'Source Activity',
    getValue: () => showField ? (element.businessObject.tmpSourceActivity || '') : '',
    setValue: (value) => {
      if (showField) {
        modeling.updateProperties(element, { tmpSourceActivity: value });
      }
    },
    getOptions: () => showField ? getActivities() : [{ value: '', label: 'Not needed for unary constraints' }],
    disabled: !showField
  });
}

function TargetActivitySelectEntry(props) {
  const { element, elementRegistry, modeling } = props;

  const getActivities = () => {
    const activities = [];
    const elements = elementRegistry.getAll();

    elements.forEach(el => {
      if (el.businessObject &&
        (el.businessObject.$type === 'bpmn:Task' ||
          el.businessObject.$type === 'bpmn:UserTask' ||
          el.businessObject.$type === 'bpmn:ServiceTask' ||
          el.businessObject.$type === 'bpmn:ManualTask' ||
          el.businessObject.$type === 'bpmn:ScriptTask' ||
          el.businessObject.$type === 'bpmn:BusinessRuleTask' ||
          el.businessObject.$type === 'bpmn:SendTask' ||
          el.businessObject.$type === 'bpmn:ReceiveTask')) {

        const activityName = el.businessObject.name || el.id;
        activities.push({
          value: el.id,
          label: activityName
        });
      }
    });

    return [{ value: '', label: 'Select activity...' }, ...activities.sort((a, b) => a.label.localeCompare(b.label))];
  };

  const currentType = element.businessObject.tmpConstraintType || '';
  const isUnary = ['existence', 'absence2'].includes(currentType);
  const showField = currentType !== '';

  return SelectEntry({
    element,
    id: 'newTargetActivity',
    label: isUnary ? 'Activity' : 'Target Activity',
    getValue: () => showField ? (element.businessObject.tmpTargetActivity || '') : '',
    setValue: (value) => {
      if (showField) {
        modeling.updateProperties(element, { tmpTargetActivity: value });
      }
    },
    getOptions: () => showField ? getActivities() : [{ value: '', label: 'Select constraint type first' }],
    disabled: !showField
  });
}

// createConstraint uses the services passed to ExistingConstraintsEntry via closure
function createConstraintFactory(elementRegistry, modeling, bpmnFactory, eventBus) {
  return () => {
    const type = (elementRegistry.getAll().find(el => el.businessObject && (el.businessObject.tmpConstraintType !== undefined)))?.businessObject?.tmpConstraintType || '';
    const sourceActivity = (elementRegistry.getAll().find(el => el.businessObject && (el.businessObject.tmpSourceActivity !== undefined)))?.businessObject?.tmpSourceActivity || '';
    const targetActivity = (elementRegistry.getAll().find(el => el.businessObject && (el.businessObject.tmpTargetActivity !== undefined)))?.businessObject?.tmpTargetActivity || '';

    if (!type) {
      alert('Please select a constraint type');
      return;
    }

    const unaryConstraints = ['existence', 'absence2'];
    const isUnary = unaryConstraints.includes(type);

    if (isUnary) {
      if (!targetActivity) {
        alert('Please select an activity');
        return;
      }
      sourceActivity = targetActivity; // Use same activity for both
    } else {
      if (!sourceActivity || !targetActivity) {
        alert('Please select both source and target activities');
        return;
      }
      if (sourceActivity === targetActivity) {
        alert('Source and target activities must be different');
        return;
      }
    }

    try {
      const sourceElement = elementRegistry.get(sourceActivity);
      const targetElement = elementRegistry.get(targetActivity);

      if (!sourceElement || !targetElement) {
        alert('Selected activities not found');
        return;
      }

      // Find proper parent
      const parent = findConstraintParent(sourceElement, targetElement, elementRegistry);
      if (!parent) {
        alert('Could not find proper parent container for constraint');
        return;
      }

      // Create constraint flow
      const constraintFlow = bpmnFactory.create('constraint:ConstraintFlow', {
        id: 'ConstraintFlow_' + Math.random().toString(36).substr(2, 9),
        constraintType: type,
        sourceActivity: sourceActivity,
        targetActivity: targetActivity,
        sourceRef: sourceElement.businessObject,
        targetRef: targetElement.businessObject
      });

      // Calculate waypoints
      const waypoints = isUnary ?
        calculateManhattanWaypoints(sourceElement, sourceElement) :
        calculateManhattanWaypoints(sourceElement, targetElement);

      // Create connection
      modeling.createConnection(
        sourceElement,
        targetElement,
        {
          type: 'constraint:ConstraintFlow',
          businessObject: constraintFlow,
          waypoints: waypoints
        },
        parent
      );

      // Reset form
      // clear temporary selections on the element(s)
      const host = elementRegistry.getAll().find(el => el.businessObject && (el.businessObject.tmpConstraintType !== undefined || el.businessObject.tmpSourceActivity !== undefined || el.businessObject.tmpTargetActivity !== undefined));
      if (host) {
        modeling.updateProperties(host, { tmpConstraintType: '', tmpSourceActivity: '', tmpTargetActivity: '' });
      }

      // Simple refresh without timeout
      eventBus.fire('propertiesPanel.refresh');

    } catch (error) {
      console.error('Error creating constraint:', error);
      alert('Failed to create constraint: ' + error.message);
    }
  };
}

function findConstraintParent(sourceElement, targetElement, elementRegistry) {
  const rootElement = elementRegistry.get('Process_1') || elementRegistry.getAll().find(el =>
    el.businessObject && el.businessObject.$type === 'bpmn:Process'
  );

  if (rootElement) {
    return rootElement;
  }

  const collaboration = elementRegistry.getAll().find(el =>
    el.businessObject && el.businessObject.$type === 'bpmn:Collaboration'
  );

  if (collaboration) {
    return collaboration;
  }

  let parent = sourceElement.parent;
  while (parent && parent.type !== 'bpmn:Collaboration' && parent.type !== 'bpmn:Process') {
    parent = parent.parent;
  }

  return parent || sourceElement.parent;
}

function calculateManhattanWaypoints(sourceElement, targetElement) {
  const sourceBounds = sourceElement;

  if (!targetElement || targetElement === sourceElement) {
    // Unary constraint
    const centerX = sourceBounds.x + sourceBounds.width / 2;
    const centerY = sourceBounds.y + sourceBounds.height / 2;
    const rightX = sourceBounds.x + sourceBounds.width;
    const topY = sourceBounds.y;

    return [
      { x: rightX, y: centerY },
      { x: rightX + 30, y: centerY },
      { x: rightX + 30, y: topY - 30 },
      { x: centerX, y: topY - 30 },
      { x: centerX, y: topY }
    ];
  } else {
    // Binary constraint
    const targetBounds = targetElement;

    const sourceCenter = {
      x: sourceBounds.x + sourceBounds.width / 2,
      y: sourceBounds.y + sourceBounds.height / 2
    };

    const targetCenter = {
      x: targetBounds.x + targetBounds.width / 2,
      y: targetBounds.y + targetBounds.height / 2
    };

    let sourcePoint, targetPoint;

    if (Math.abs(sourceCenter.x - targetCenter.x) > Math.abs(sourceCenter.y - targetCenter.y)) {
      if (sourceCenter.x < targetCenter.x) {
        sourcePoint = { x: sourceBounds.x + sourceBounds.width, y: sourceCenter.y };
        targetPoint = { x: targetBounds.x, y: targetCenter.y };
      } else {
        sourcePoint = { x: sourceBounds.x, y: sourceCenter.y };
        targetPoint = { x: targetBounds.x + targetBounds.width, y: targetCenter.y };
      }
    } else {
      if (sourceCenter.y < targetCenter.y) {
        sourcePoint = { x: sourceCenter.x, y: sourceBounds.y + sourceBounds.height };
        targetPoint = { x: targetCenter.x, y: targetBounds.y };
      } else {
        sourcePoint = { x: sourceCenter.x, y: sourceBounds.y };
        targetPoint = { x: targetCenter.x, y: targetBounds.y + targetBounds.height };
      }
    }

    const waypoints = [sourcePoint];

    if (sourcePoint.x !== targetPoint.x && sourcePoint.y !== targetPoint.y) {
      if (Math.abs(sourcePoint.x - targetPoint.x) > Math.abs(sourcePoint.y - targetPoint.y)) {
        waypoints.push({ x: targetPoint.x, y: sourcePoint.y });
      } else {
        waypoints.push({ x: sourcePoint.x, y: targetPoint.y });
      }
    }

    waypoints.push(targetPoint);
    return waypoints;
  }
}