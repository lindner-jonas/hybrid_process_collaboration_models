# Collaborations Beyond Simple Message Flows
# And What Multi-model Processes Have to Do With It

This repository includes the proof-of-concept implementation for modeling and simulating multi-model process collaboration defined as a hybrid of BPMN and Declare.

([go to the setup directly](#Setup))

The tool is build on top of the BPMN token simulation extension of bpmn.io. For further details, [click here](https://github.com/bpmn-io/bpmn-js-token-simulation).

## Modeling

To model declarative constraints, one has to create a BPMN collaboration model and add Declare constraints between activities of different pools.
In order to do so, one can either use the custom element that was added to the bottom of the modeling panel on the left and choose the constraint template from the menu that will be shown on the right, or use the constraint management panel on the right:
![Modeling Environment](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Modeling_Environment.png?raw=true)
It should be mentioned that one current limitation is the modeling of unary constraints. The initial implementation only considered binary constraints between two activities. For that reason, to include "existence" and "absence2", one has to add a constraint between the activity of interest and an arbitrary second one, which will be disregarded later.

Even though the tool is built on top of bpmn.io and, thus, includes all available elements of BPMN 2.0, the approach only supports the subset of BPMN that is shown in this picture:
![supported subset of BPMN](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Supported_BPMN_elements.jpeg?raw=true)
The Declare constraints supported in the tool are:
![supported subset of BPMN](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Supported_Declare_constraints.png?raw=true)


## Simulation

The simulation in the frontend is based on the initial implementation of the BPMN token simulation extension. However, the tool was extended to incorporate execution semantics for multi-model collaborations.

### Execution

Simulation can be done in two ways:
- Manual: each activity has to be executed manually, which allows for full control over the process behaviour.
- Semi-automatic (Default): when the process starts, the tokens run through the model on their own, only stopping at events that correspond to receiving messages, decision points and the second activity of a constraints.
Automatic execution can be stopped by using the panel on the right of the simulation screen (the PAUSE button on the bottom of the panel).

### Colouring

Coloring is currently based on an early version of the tool and correspond to the coloring of automata from related works ([[1]](#1),[[2]](#2)). The colors have the following meaning:
- $${\color{green}GREEN}$$: the constraint is permanently satisfied ![a satisfied constraint](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Satisfied_constraint.png?raw=true)
- $${\color{yellow}YELLOW}$$: the constraint is temporarily satisfied, but we can reach a state in which the constraint is violated ![a temporarily satisfied constraint](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Temporarily_satisfied_constraint.png?raw=true)
- $${\color{orange}ORANGE}$$: the constraint is temporarily violated, but we can reach a state in which the constraint is satisfied ![a temporarily violated constraint](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Temporarily_violated_constraint.png?raw=true)
- $${\color{red}RED}$$: the constraint is permanently violated ![a violated constraint](https://github.com/lindner-jonas/hybrid_process_collaboration_models/blob/main/pictures/Violated_constraint.png?raw=true)

## Setup 

This repository includes a setup for building and running a Docker container in which both the frontend and backend are run.

After cloning the repository, one has to execute the following command from the root directory:
```
docker-compose -f .\docker-compose.prod.yml up --build
```
(Provided that docker-compose is installed. For further details, [click here](https://docs.docker.com/compose/).)

For accessing the modeling environment, open a browser and go to [localhost/modeler.html](http://localhost/modeler.html) (port 80).


## References
<a id="1">[1]</a>
De Giacomo, G., De Masellis, R., Maria Maggi, F., Montali, M.: 
Monitoring constraints and metaconstraints with temporal logics on finite traces. ACM Trans. Softw. Eng. Methodol. 31(4), 68:1–68:44 (2022)

<a id="2">[2]</a>
Alman, A., Maggi, F.M., Montali, M., Patrizi, F., Rivkin, A.: 
Monitoring hybrid process specifications with conflict management: An automata-theoretic approach. Artificial Intelligence in Medicine 139, 102512 (2023)
