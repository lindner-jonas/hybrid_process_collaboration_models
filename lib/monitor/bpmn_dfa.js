import swal from 'sweetalert';

export async function test(bpmnjs) {

  const { xml } = await bpmnjs.saveXML();

  const xmlDoc = parseXml(xml);
  let constrains = extractCostrains(xmlDoc);
  let bpmnsByPools = splitBpmnByPool(xmlDoc);

  // Store constraint information globally for ID mapping
  globalConstraints = constrains;

  // Show loading popup
  swal({
    title: 'Generating DFA...',
    text: 'Please wait while we process your model',
    icon: 'info',
    buttons: false,
    closeOnClickOutside: false,
    closeOnEsc: false
  });

  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

  fetch(`${backendUrl}/generateDfa`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        models: bpmnsByPools,
        constrains: constrains
      }
    )
  })
    .then(response => response.json())
    .then(data => {
      swal.close();

      console.log('API response:', data);

      // Parse the colored DFA from the server response
      if (data.colored_dfa) {
        const coloredDFA = parseColoredDFA(data.colored_dfa);
        console.log('Parsed ColoredDFA:', coloredDFA);

        globalColoredDFA = coloredDFA;
        currentDFAState = coloredDFA.initState;

        initializeSimulationMonitoring(bpmnjs);

        swal({
          title: 'Success!',
          text: 'DFA generated successfully!',
          icon: 'success',
          button: 'OK'
        });
      }
    })
    .catch(error => {
      swal.close();

      console.error('API error:', error);

      swal({
        title: 'Error!',
        text: 'Failed to generate DFA. error: ' + error.message,
        icon: 'error',
        button: 'OK'
      });
    });
}

function parseXml(strXml) {
  const parser = new DOMParser();
  return parser.parseFromString(strXml, 'text/xml');
}

function extractCostrains(xmlDoc) {
  const constraintFlows = xmlDoc.getElementsByTagName('constraint:constraintFlow');
  let constrains = [];
  for (let i = 0; i < constraintFlows.length; i++) {
    const flow = constraintFlows[i];
    constrains.push({
      id: flow.getAttribute('id'),
      sourceRef: flow.getAttribute('sourceRef'),
      targetRef: flow.getAttribute('targetRef'),
      constraintType: flow.getAttribute('constraintType')
    });
  }
  return constrains;
}

function splitBpmnByPool(xmlDoc) {
  const serializer = new XMLSerializer();
  const participants = Array.from(xmlDoc.getElementsByTagName('bpmn:participant'));
  const processes = Array.from(xmlDoc.getElementsByTagName('bpmn:process'));

  if (participants.length === 0) {
    const processId = processes.length > 0 ? processes[0].getAttribute('id') : 'no_pool';
    const xmlStr = serializer.serializeToString(xmlDoc);
    return [ { id: processId, xml: xmlStr } ];
  }

  const processMap = {};
  processes.forEach(p => {
    const id = p.getAttribute('id');
    processMap[id] = p;
  });

  const results = [];

  for (const participant of participants) {
    const processRef = participant.getAttribute('processRef');
    const originalProcess = processMap[processRef];
    if (!originalProcess) continue;

    // Clone the process node (true for deep clone)
    const clonedProcess = originalProcess.cloneNode(true);

    // Create a new definitions wrapper in the same document context
    const newDefs = xmlDoc.implementation.createDocument(
      'http://www.omg.org/spec/BPMN/20100524/MODEL',
      'bpmn:definitions',
      null
    );

    const defsElement = newDefs.documentElement;
    defsElement.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    defsElement.setAttribute('id', `Definitions_${processRef}`);
    defsElement.setAttribute('targetNamespace', 'http://bpmn.io/schema/bpmn');

    // Import the cloned process into the new document
    const importedProcess = newDefs.importNode(clonedProcess, true);
    defsElement.appendChild(importedProcess);

    // Serialize the new document
    const xmlStr = serializer.serializeToString(newDefs);
    results.push({ id: processRef, xml: xmlStr });
  }

  return results;
}

function parseColoredDFA(coloredDfaData) {

  /**
   * Parse the colored DFA data from the Python server into a JavaScript object
   *
   * @param {Object} coloredDfaData - The colored DFA data from the server
   * @returns {Object} Parsed ColoredDFA object
   */

  // Helper function to parse state strings back to original format if needed
  function parseState(stateStr) {
    if (typeof stateStr === 'string' && stateStr.startsWith('(') && stateStr.endsWith(')')) {
      const inner = stateStr.slice(1, -1); // Remove parentheses
      return inner.split(',').map(s => s.trim());
    }
    return stateStr;
  }

  // Helper function to parse transitions
  function parseTransitions(transitionData) {
    const transitions = {};

    Object.keys(transitionData).forEach(state => {
      const stateTransitions = transitionData[state];
      transitions[state] = stateTransitions.map(transition => ({
        symbol: transition.symbol,
        target: transition.target,
        parsedTarget: parseState(transition.target)
      }));
    });

    return transitions;
  }

  // Helper function to parse colors
  function parseColors(colorsData) {
    const colors = {};

    Object.keys(colorsData).forEach(state => {
      colors[state] = colorsData[state];
    });

    return colors;
  }

  // Parse the main ColoredDFA structure
  const parsedDFA = {
    current: parseState(coloredDfaData.current),
    states: coloredDfaData.states.map(state => parseState(state)),
    alphabet: [ ...coloredDfaData.alphabet ], // Create a copy of the alphabet array
    transitionFunction: parseTransitions(coloredDfaData.transition_function),
    initState: parseState(coloredDfaData.init_state),
    acceptStates: coloredDfaData.accept_states.map(state => parseState(state)),
    colors: parseColors(coloredDfaData.colors),

    // Add utility methods
    getTransitionsFrom: function(state) {
      const stateKey = typeof state === 'object' ? `(${state.join(',')})` : state;
      return this.transitionFunction[stateKey] || [];
    },

    getStateColor: function(state) {
      const stateKey = typeof state === 'object' ? `(${state.join(',')})` : state;
      return this.colors[stateKey] || null;
    },

    canTransition: function(fromState, symbol) {
      const transitions = this.getTransitionsFrom(fromState);
      return transitions.some(t => t.symbol === symbol);
    },

    getNextState: function(fromState, symbol) {
      const transitions = this.getTransitionsFrom(fromState);
      const transition = transitions.find(t => t.symbol === symbol);
      return transition ? transition.target : null;
    },

    isAcceptState: function(state) {
      const stateStr = typeof state === 'object' ? `(${state.join(',')})` : state;
      return this.acceptStates.some(acceptState => {
        const acceptStateStr = typeof acceptState === 'object' ? `(${acceptState.join(',')})` : acceptState;
        return acceptStateStr === stateStr;
      });
    },

    // Method to get all possible symbols from a state
    getAvailableSymbols: function(state) {
      const transitions = this.getTransitionsFrom(state);
      return [ ...new Set(transitions.map(t => t.symbol)) ];
    }
  };

  return parsedDFA;
}

let globalColoredDFA = null;
let currentDFAState = null;
let simulationEventBus = null;
let globalConstraints = null;
let isMonitoringInitialized = false;
let eventListeners = [];

export function initializeSimulationMonitoring(bpmnjs) {

  /**
   * Initialize simulation monitoring to capture fired activities
   *
   * @param {Object} bpmnjs - The BPMN.js modeler instance
   */


  try {

    // Get the event bus from the modeler
    simulationEventBus = bpmnjs.get('eventBus');

    // Clean up existing listeners if already initialized
    if (isMonitoringInitialized) {
      console.log('Cleaning up existing event listeners...');
      cleanupEventListeners();
    }

    // Clear the event listeners array
    eventListeners = [];

    // Add debug listener to see all simulation events
    const debugListener = (eventName, event) => {
      if (eventName.startsWith('tokenSimulation')) {
        console.log('[Event Debug]', eventName, event);
      }
    };
    simulationEventBus.on('*', debugListener);
    eventListeners.push({ event: '*', handler: debugListener });

    // Listen to token simulation events
    const traceListener = (event) => {
      handleActivityFired(event.element, event.action);
    };
    simulationEventBus.on('tokenSimulation.simulator.trace', traceListener);
    eventListeners.push({ event: 'tokenSimulation.simulator.trace', handler: traceListener });

    // Listen to simulation start/stop events
    const toggleModeListener = (event) => {
      console.log('Token simulation mode toggled:', event.active);
      if (event.active && globalColoredDFA) {

        // Simulation mode activated
        currentDFAState = globalColoredDFA.initState;
        console.log('DFA initialized to state:', currentDFAState);
      }
    };
    simulationEventBus.on('tokenSimulation.toggleMode', toggleModeListener);
    eventListeners.push({ event: 'tokenSimulation.toggleMode', handler: toggleModeListener });

    const playSimulationListener = () => {
      console.log('Simulation started (play)');
      if (globalColoredDFA) {
        currentDFAState = globalColoredDFA.initState;
        console.log('DFA initialized to state:', currentDFAState);
      }
    };
    simulationEventBus.on('tokenSimulation.playSimulation', playSimulationListener);
    eventListeners.push({ event: 'tokenSimulation.playSimulation', handler: playSimulationListener });

    const pauseSimulationListener = () => {
      console.log('Simulation paused');
    };
    simulationEventBus.on('tokenSimulation.pauseSimulation', pauseSimulationListener);
    eventListeners.push({ event: 'tokenSimulation.pauseSimulation', handler: pauseSimulationListener });

    const resetSimulationListener = () => {
      console.log('Simulation reset');
      if (globalColoredDFA) {
        currentDFAState = globalColoredDFA.initState;
        console.log('DFA reset to state:', currentDFAState);
      }
    };
    simulationEventBus.on('tokenSimulation.resetSimulation', resetSimulationListener);
    eventListeners.push({ event: 'tokenSimulation.resetSimulation', handler: resetSimulationListener });

    // Mark as initialized
    isMonitoringInitialized = true;

    console.log('Simulation monitoring initialized');
    console.log('EventBus available:', !!simulationEventBus);
    console.log('DFA available:', !!globalColoredDFA);
  } catch (error) {
    console.error('Failed to initialize simulation monitoring:', error);
  }
}

function cleanupEventListeners() {

  /**
   * Clean up existing event listeners
   */
  if (simulationEventBus && eventListeners.length > 0) {
    eventListeners.forEach(({ event, handler }) => {
      simulationEventBus.off(event, handler);
    });
    console.log(`Cleaned up ${eventListeners.length} event listeners`);
  }
}

function handleActivityFired(element, eventType) {

  /**
   * Handle when an activity is fired during simulation
   *
   * @param {Object} element - The BPMN element that was fired
   * @param {string} eventType - 'enter' or 'exit'
   */

  if (!element || !element.businessObject) {
    console.log('[handleActivityFired] Invalid element:', element);
    return;
  }

  const activityName = element.businessObject.name || element.id;
  const activityId = element.id;

  // const activityType = element.businessObject.$type;


  if (eventType === 'exit' && globalColoredDFA.getAvailableSymbols(currentDFAState).includes(activityId)) {
    console.log(`[Activity Processing] Processing activity: ${activityId}`);
    processActivityInDFA(activityId, activityName);
  }
}

function processActivityInDFA(activityId, activityName) {

  /**
   * Process the fired activity in the DFA to check constraints and update state
   *
   * @param {string} activityId - The activity ID
   * @param {string} activityName - The activity name
   */

  if (!globalColoredDFA || !currentDFAState) {
    console.log('DFA not available for activity processing');
    return;
  }

  console.log(`[DFA Processing] Activity: ${activityName} (${activityId})`);
  console.log(`[DFA Processing] Current state: ${currentDFAState}`);

  // Check if we can transition with this activity
  const canTransition = globalColoredDFA.canTransition(currentDFAState, activityId);

  if (canTransition) {

    // Get the next state
    const nextState = globalColoredDFA.getNextState(currentDFAState, activityId);

    console.log(`[DFA Transition] ${currentDFAState} --[${activityId}]--> ${nextState}`);

    // Update current state
    const previousState = currentDFAState;
    currentDFAState = nextState;

    // Check state colors (constraint satisfaction)
    const stateColor = globalColoredDFA.getStateColor(currentDFAState);
    console.log('[DFA State Color]', stateColor);

    // Check for constraint violations
    checkConstraintViolations(previousState, currentDFAState, activityId, stateColor);

    // Fire custom events
    fireActivityEvents(activityId, activityName, previousState, currentDFAState, stateColor);

  } else {
    console.warn(`[DFA Warning] Cannot transition from ${currentDFAState} with activity ${activityId}`);

    // Check available transitions
    const availableSymbols = globalColoredDFA.getAvailableSymbols(currentDFAState);
    console.log('[DFA Available] Available activities from current state:', availableSymbols);
  }
}

function checkConstraintViolations(previousState, currentState, activityId, stateColor) {

  /**
   * Check for constraint violations based on state colors
   *
   * @param {string} previousState - The previous DFA state
   * @param {string} currentState - The current DFA state
   * @param {string} activityId - The activity that caused the transition
   * @param {Object} stateColor - The color information for the current state
   */

  if (!stateColor) return;

  // Iterate through constraint colors for this state
  if (Array.isArray(stateColor)) {
    stateColor.forEach((constraintColor, index) => {
      if (constraintColor && typeof constraintColor === 'object') {
        Object.keys(constraintColor).forEach(constraintFlowId => {
          const status = constraintColor[constraintFlowId];

          console.log(`[Constraint Check] Constraint Flow ID: ${constraintFlowId}, Status: ${status}`);

          // Publish constraint status change event for the renderer
          publishConstraintStatusEvent(constraintFlowId, status, activityId, currentState);

          if (status === 'violated' || status === 'temporary_violated') {
            handleConstraintViolation(constraintFlowId, status, activityId, currentState);
          } else if (status === 'satisfied' || status === 'temporary_satisfied') {
            handleConstraintSatisfaction(constraintFlowId, status, activityId, currentState);
          }
        });
      }
    });
  }
}

function handleConstraintViolation(constraintFlowId, status, activityId, currentState) {

  /**
   * Handle constraint violations
   */

  // Get constraint type from global constraints if available
  let constraintType = 'unknown';
  if (globalConstraints && Array.isArray(globalConstraints)) {
    const constraint = globalConstraints.find(c => c.id === constraintFlowId);
    if (constraint) {
      constraintType = constraint.constraintType;
    }
  }

  console.error(`[CONSTRAINT VIOLATION] Constraint Flow ${constraintFlowId} (${constraintType}) is ${status} after activity ${activityId}`);

  // Fire custom event for constraint violation
  if (simulationEventBus) {
    simulationEventBus.fire('constraint.violation.detected', {
      constraintFlowId: constraintFlowId,
      constraintType: constraintType,
      status: status,
      violatingActivity: activityId,
      currentState: currentState,
      timestamp: new Date()
    });
  }

  // You can add UI notifications here
  // For example, highlight the violating activity in red
  showConstraintViolationNotification(constraintFlowId, constraintType, activityId);
}

function handleConstraintSatisfaction(constraintFlowId, status, activityId, currentState) {

  /**
   * Handle constraint satisfactions
   */

  // Get constraint type from global constraints if available
  let constraintType = 'unknown';
  if (globalConstraints && Array.isArray(globalConstraints)) {
    const constraint = globalConstraints.find(c => c.id === constraintFlowId);
    if (constraint) {
      constraintType = constraint.constraintType;
    }
  }

  console.log(`[CONSTRAINT SATISFIED] Constraint Flow ${constraintFlowId} (${constraintType}) is ${status} after activity ${activityId}`);

  // Fire custom event for constraint satisfaction
  if (simulationEventBus) {
    simulationEventBus.fire('constraint.satisfaction.detected', {
      constraintFlowId: constraintFlowId,
      constraintType: constraintType,
      status: status,
      satisfyingActivity: activityId,
      currentState: currentState,
      timestamp: new Date()
    });
  }
}

function fireActivityEvents(activityId, activityName, previousState, currentState, stateColor) {

  /**
   * Fire custom events for activity execution
   */

  if (!simulationEventBus) return;

  // General activity fired event
  simulationEventBus.fire('dfa.activity.fired', {
    activityId: activityId,
    activityName: activityName,
    previousState: previousState,
    currentState: currentState,
    stateColor: stateColor,
    timestamp: new Date()
  });

  // Specific events based on activity name patterns
  const lowerActivityName = activityName.toLowerCase();

  if (lowerActivityName.includes('approve')) {
    simulationEventBus.fire('dfa.approval.activity', {
      activityId: activityId,
      activityName: activityName,
      currentState: currentState
    });
  }

  if (lowerActivityName.includes('reject')) {
    simulationEventBus.fire('dfa.rejection.activity', {
      activityId: activityId,
      activityName: activityName,
      currentState: currentState
    });
  }
}

function showConstraintViolationNotification(constraintFlowId, constraintType, activityId) {

  /**
   * Show a notification for constraint violations
   * You can customize this based on your UI framework
   */

  console.log('Constraint Violation: Constraint Flow ${constraintFlowId} (${constraintType}) violated by activity ${activityId}');

  // Example: You could integrate with a notification system here
  // toast.error(`Constraint ${constraintType} violated by ${activityId}`);
}

function publishConstraintStatusEvent(constraintFlowId, status, activityId, currentState) {

  /**
   * Publish constraint status change event for the constraint flow renderer
   *
   * @param {string} constraintFlowId - The ID of the specific constraint flow
   * @param {string} status - The constraint status ('satisfied', 'temporary_satisfied', 'temporary_violated', 'violated')
   * @param {string} activityId - The activity that triggered the status change
   * @param {string} currentState - The current DFA state
   */

  if (!simulationEventBus) return;

  // Get constraint type from global constraints if available
  let constraintType = 'unknown';
  if (globalConstraints && Array.isArray(globalConstraints)) {
    const constraint = globalConstraints.find(c => c.id === constraintFlowId);
    if (constraint) {
      constraintType = constraint.constraintType;
    }
  }

  const statusEvent = {
    constraintFlowId: constraintFlowId,
    constraintType: constraintType,
    status: status,
    activityId: activityId,
    currentState: currentState,
    timestamp: new Date(),
    color: getStatusColor(status)
  };

  console.log(`[Constraint Status Event] Constraint Flow ID: ${constraintFlowId} (${constraintType}): ${status} (${getStatusColor(status)})`);

  // Fire the main constraint status event
  simulationEventBus.fire('constraint.status.changed', statusEvent);

  // Fire specific events for different status types
  switch (status) {
  case 'satisfied':
    simulationEventBus.fire('constraint.satisfied', statusEvent);
    break;
  case 'temporary_satisfied':
    simulationEventBus.fire('constraint.temporary_satisfied', statusEvent);
    break;
  case 'temporary_violated':
    simulationEventBus.fire('constraint.temporary_violated', statusEvent);
    break;
  case 'violated':
    simulationEventBus.fire('constraint.violated', statusEvent);
    break;
  }
}


function getStatusColor(status) {

  /**
   * Map constraint status to colors
   *
   * @param {string} status - The constraint status
   * @returns {string} The corresponding color
   */

  const colorMap = {
    'satisfied': '#28a745',
    'temporary_satisfied': '#ffc107',
    'temporary_violated': '#fd7e14',
    'violated': '#dc3545'
  };

  return colorMap[status] || '#6c757d'; // Default gray
}


