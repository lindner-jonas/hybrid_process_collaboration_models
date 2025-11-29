from app.model.main_model import BpmnData, ConstraintData, DeterministicFiniteAutomaton, ColoredDFA
from pm4py.objects.bpmn.importer import importer as bpmn_importer
from pm4py.objects.conversion.bpmn import converter as bpmn_converter
import pm4py.objects.bpmn.util.bpmn_utils as bpmn_utils 
from pm4py.objects.transition_system.obj import TransitionSystem
from pm4py.objects.petri_net.utils import reachability_graph, petri_utils
from pm4py.visualization.petri_net import visualizer as pn_visualizer
from pm4py.visualization.transition_system import visualizer as ts_visualizer
import tempfile
import os
import shutil
import xml.etree.ElementTree as ET
import re

from app.service.dfa_service import build_colored_dfa

SATISFIED = 'satisfied'
TEMPORARY_SATISFIED = "temporary_satisfied"
TEMPORARY_VIOLATED = "temporary_violated"
VIOLATED = "violated"

def generate_dfa(bpmn_models: list[BpmnData], constrains: list[ConstraintData]) -> dict:
    # shutil.rmtree("pic")
    # os.mkdir("pic")

    process_dfas = []
    process_dfa_param = []

    for idx, bpmn_model in enumerate(bpmn_models):
        with tempfile.NamedTemporaryFile(delete=False, suffix=".bpmn") as tmp:
            tmp.write(bpmn_model.xml.encode("utf-8"))
            tmp_path = tmp.name

        bpmn_graph = bpmn_importer.apply(tmp_path)
        os.unlink(tmp_path)

        flow_ids = get_sequence_flow_ids(bpmn_model.xml)
        petri_net = convert_bpmn_to_petri_net(bpmn_graph)

        #save_visualized_petri_net("pic/" + str(idx) + "_petri_net.png", petri_net)
        transition_system = convert_petri_net_to_ts(petri_net)
        #save_visualized_transition_system("pic/" + str(idx) + "_transition_system.png", transition_system)
        dfa = convert_transition_system_to_dfa(transition_system, str(idx), flow_ids)
        process_dfas.append(dfa)

    # for p_dfa in process_dfas:
    #     process_dfa_param.append((p_dfa.id, p_dfa.states, p_dfa.alphabet, p_dfa.transition_function, p_dfa.initial_states, p_dfa.accepting_states))

    # constraint_param = []
    # for p_const in constrains:
    #     constraint_param.append((p_const.constraintType, p_const.id, p_const.sourceRef, p_const.targetRef))

    result = build_colored_dfa(process_dfas, constrains)

    # Convert the ColoredDFA to JSON-serializable format
    json_result = colored_dfa_to_json(result)

    return {
        "message": "DFA generation completed successfully",
        "colored_dfa": json_result
    }

def get_sequence_flow_ids(bpmn_xml) -> list[(str,str,str)]:
    root = ET.fromstring(bpmn_xml)
    flow_ids = set()
    for flow in root.findall(".//{http://www.omg.org/spec/BPMN/20100524/MODEL}sequenceFlow"):
        flow_ids.add((flow.get("id"), flow.get("sourceRef"), flow.get("targetRef")))
    return flow_ids

def convert_bpmn_to_petri_net(bpmn_graph: any) -> tuple[any, any, any]:
    net, initial_marking, final_marking = bpmn_converter.apply(bpmn_graph, parameters={'semantic': False})
    return net, initial_marking, final_marking

def convert_petri_net_to_ts(pn: tuple[any, any, any]) -> TransitionSystem:
    return reachability_graph.construct_reachability_graph(pn[0], pn[1])

def save_visualized_petri_net(pt_output_path: str, pn: tuple[any, any, any]):
    bpmn_gviz = pn_visualizer.apply(pn[0], pn[1], pn[2])
    pn_visualizer.save(bpmn_gviz, pt_output_path)

def save_visualized_transition_system(ts_output_path: str, ts: TransitionSystem):
    ts_gviz = ts_visualizer.apply(ts)
    ts_visualizer.save(ts_gviz, ts_output_path)

def convert_transition_system_to_dfa(ts: TransitionSystem, id: str, flow_ids: list[(str,str,str)]) -> DeterministicFiniteAutomaton:
    dfa = DeterministicFiniteAutomaton()
    dfa.id = id

    def normalize_state_name(state_name):
        if state_name.startswith("sink") or state_name.startswith("source"):
            return f"P{id}_{state_name}"
        if state_name.startswith("ent_"):
            return f"P{id}_{state_name.strip('ent_')}"
        if state_name.startswith("exi_"):
            return f"P{id}_{state_name.strip('exi_')}"
        return state_name

    def is_random_id(uuid_string):
        # regex pattern for UUID
        uuid_pattern = r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
        return bool(re.match(uuid_pattern, uuid_string))

    for state in ts.states:
        dfa.states.add(normalize_state_name(state.name))
        if len(state.outgoing) == 0 and len(state.incoming) != 0:
            dfa.accepting_states.add(normalize_state_name(state.name))
        if len(state.incoming) == 0 and len(state.outgoing) != 0:
            dfa.initial_states.add(normalize_state_name(state.name))

    for transition in ts.transitions:
        from_state = normalize_state_name(transition.from_state.name)
        to_state = normalize_state_name(transition.to_state.name)

        # Extract just the activity part from the transition label
        label = transition.name

        # If the label is a string like "(Activity_1xqawls, 'G')", extract just the activity part
        if isinstance(label, str) and label.startswith('(') and ',' in label:
            try:
                # Remove parentheses and split by comma
                inner_content = label.strip('()')
                parts = inner_content.split(',')
                if len(parts) > 0:
                    # Get the first part (activity) and clean it up
                    activity_part = parts[0].strip().strip('\'"')
                    label = activity_part

                    # Remove sfl prefix
                    if label.startswith("sfl_"):
                        label = label.strip("sfl_")
                    # change random ids to flow_id
                    if is_random_id(label):
                        if "source" in from_state and "Gateway" in to_state:
                            #print("    ",from_state, label, to_state)
                            for flow in flow_ids:
                                flow_id = flow[0]
                                source = flow[1]
                                target = flow[2]
                                #print("    ",flow_id, source, target)
                                if target in to_state:
                                    if "StartEvent_" in source or "Event_" in source:
                                        label = flow_id
            except Exception as e:
                # If parsing fails, use the original label
                print(f"Failed to parse label {label}: {e}")

        print('label: ', label)
        dfa.alphabet.add(label)
        if from_state not in dfa.transition_function:
            dfa.transition_function[from_state] = set()
        dfa.transition_function[from_state].add((label, to_state))

    return dfa



def colored_dfa_to_json(colored_dfa: ColoredDFA) -> dict:
    """
    Convert a ColoredDFA object to a JSON-serializable dictionary.

    Args:
        colored_dfa: The ColoredDFA object to convert

    Returns:
        A dictionary that can be serialized to JSON
    """
    def convert_set_to_list(obj):
        """Helper function to convert sets to lists recursively"""
        if isinstance(obj, set):
            return list(obj)
        elif isinstance(obj, dict):
            return {str(k): convert_set_to_list(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_set_to_list(item) for item in obj]
        else:
            return obj

    def serialize_state(state):
        """Convert state (which might be a tuple) to a string representation"""
        if isinstance(state, tuple):
            return f"({','.join(str(s) for s in state)})"
        # if isinstance(state, set):
        #     if len(state) == 1:
        #         return str(tuple(next(iter(state))))
        return str(state)

    def serialize_transitions(transitions):
        """Convert transition dictionary to JSON-serializable format"""
        serialized = {}
        for state, transition_set in transitions.items():
            state_key = serialize_state(state)
            # Convert set of transitions to list of dictionaries
            transition_list = []
            for transition in transition_set:
                if isinstance(transition, tuple) and len(transition) == 2:
                    symbol, target_state = transition
                    transition_list.append({
                        "symbol": str(symbol),
                        "target": serialize_state(target_state)
                    })
                else:
                    transition_list.append(str(transition))
            serialized[state_key] = transition_list
        return serialized

    def serialize_colors(colors):
        """Convert colors dictionary to JSON-serializable format"""
        serialized = {}
        for state, color_list in colors.items():
            state_key = serialize_state(state)
            serialized[state_key] = convert_set_to_list(color_list)
        return serialized

    # Build the JSON-serializable dictionary
    json_data = {
        "current": serialize_state(colored_dfa.current),
        "states": [serialize_state(state) for state in colored_dfa.states],
        "alphabet": list(colored_dfa.alphabet),
        "transition_function": serialize_transitions(colored_dfa.transition_function),
        "init_state": serialize_state(colored_dfa.initial_states),
        "accept_states": [serialize_state(state) for state in colored_dfa.accepting_states],
        "colors": serialize_colors(colored_dfa.colors)
    }

    return json_data


