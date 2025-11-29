# dfa_module.py
from app.model.main_model import BpmnData, ConstraintData, DeterministicFiniteAutomaton, ColoredDFA, ReturnColoredDFA
import copy
import time

# include all the DFA constraint templates and generator functions here...

def build_colored_dfa(processDFAs: list[DeterministicFiniteAutomaton], constraintsFromModel: list[ConstraintData]):

    # === Multi-process DFA ===
    multi_process_DFA = DeterministicFiniteAutomaton()

    for process in processDFAs:
        #process.drawSingleDFA("process.id")
        process.updateSingleDFA()
        #process.drawSingleDFA(process.id)
        if not multi_process_DFA.states:
            multi_process_DFA.init_multi_process_dfa(process.states,process.alphabet,process.transition_function,process.initial_states,process.accepting_states,process.error_states)        
        else:
            multi_process_DFA.add_process(process)

    print("\nmulti_process dfa created with:")
    print(len(multi_process_DFA.states), "states")
    print(len(multi_process_DFA.transition_function), "transitions")
    print(len(multi_process_DFA.accepting_states), "accepting states")
    print(len(multi_process_DFA.error_states), "error states")
    #multi_process_DFA.drawMultiDFA("before")
    multi_process_DFA.rewire_Errors(len(processDFAs))
    print("\nrewired multi_process dfa created with:")
    print(len(multi_process_DFA.states), "states")
    print(len(multi_process_DFA.transition_function), "transitions")
    print(len(multi_process_DFA.accepting_states), "accepting states")
    print(len(multi_process_DFA.error_states), "error states", "\n")
    #multi_process_DFA.drawMultiDFA("after")
    # === Create constraint DFAs ===
    constraint_DFAs = []
    for constraint in constraintsFromModel:
        constraint_DFA = DeterministicFiniteAutomaton()
        
        constraint_DFA.init_constraint_dfa(constraint,multi_process_DFA.alphabet)
        print(constraint_DFA)
        #constraint_DFA.drawConstraintDFA(constraint.id)
        constraint_DFAs.append(copy.deepcopy(constraint_DFA))
        print("DFA created for: ", constraint.id, "(",constraint.constraintType,")")
    print("Number of created constraints:", len(constraint_DFAs), "\n")

    # === Create hybrid DFA ===
    hybrid_DFA = multi_process_DFA
    
    print("Adding constraint DFA to the multi-process DFA...")
    for index, constraint in enumerate(constraint_DFAs):
        print("Constraints left:", len(constraint_DFAs) - index)
        print("Current hybrid DFA: states=", format(len(hybrid_DFA.states),","), "transitions=", format(len(hybrid_DFA.transition_function),","), "accepting states=", len(hybrid_DFA.accepting_states))

        start_time = time.time()
        hybrid_DFA.add_constraint(constraint)
        hybrid_DFA.rewire_Errors(len(processDFAs))
        end_time = time.time()

        print("Constraint added to hybrid DFA:", constraint.id, "(Time taken:", float(f"{end_time - start_time:.4f}"), "seconds)")

    

    # print("\nhybrid dfa created with:")
    # print(format(len(hybrid_DFA.states),","), "states")
    # print(format(len(hybrid_DFA.transition_function),","), "transitions")
    # print(format(len(hybrid_DFA.accepting_states),","), "accepting states")
    # print(format(len(hybrid_DFA.error_states),","), "error states")
    #hybrid_DFA.drawHybridDFA()
    print("\nrewired hybrid dfa created with:")
    print(format(len(hybrid_DFA.states),","), "states")
    print(format(len(hybrid_DFA.transition_function),","), "transitions")
    print(format(len(hybrid_DFA.accepting_states),","), "accepting states")   
    print(format(len(hybrid_DFA.error_states),","), "error states", "\n")
    
    
    
    # === Colouring ===
    colored_dfa = ColoredDFA(hybrid_DFA)
    colored_dfa.add_colours(len(processDFAs),constraint_DFAs)
    print("Starting colouring of constraints...")

    current_count_total = 0
    for index, constraint in enumerate(constraint_DFAs):
        global current_count_single
        current_count_single = 0

        print("Constraints left:", len(constraint_DFAs) - index)

        start_time = time.time()
        for init in colored_dfa.initial_states:
            colored_dfa, current_count_single, visited = colored_dfa.changeColours(current_count_single, index, constraint.id, init, colored_dfa.colors[init][index][constraint.id],set())
        end_time = time.time()

        print("functions calls per constraint:", format(current_count_single,","))
        current_count_total += current_count_single
        print("Time taken for colouring of constraint", constraint.id, ":", float(f"{end_time - start_time:.4f}"), "seconds")
    
    print("functions calls total:", format(current_count_total,","))
    print("Colouring completed.\n")
    
    # print("current",colored_dfa.current)
    # print("states",colored_dfa.states)
    # print("alphabet",colored_dfa.alphabet)
    # print("trans",colored_dfa.transition_function)
    # print("init",colored_dfa.initial_states)
    # print("accept",colored_dfa.accepting_states)
    # print("colors",colored_dfa.colors)

    if len(colored_dfa.initial_states) == 1:
        colored = ReturnColoredDFA(colored_dfa)
        # for index, constraint in enumerate(constraint_DFAs):
        #     colored.drawColoredDFAforConstraint(constraint.id,len(processDFAs)+index-1)
        #colored.drawColoredDFA()
        return colored

    return colored_dfa
