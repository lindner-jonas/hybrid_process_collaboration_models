from pydantic import BaseModel
import graphviz
import copy

class BpmnData(BaseModel):
    id: str
    xml: str

class ConstraintData(BaseModel):
    id: str
    sourceRef: str
    targetRef: str
    constraintType: str

class GenerateDfaRequest(BaseModel):
    models: list[BpmnData]
    constrains: list[ConstraintData]

class DeterministicFiniteAutomaton:

    def __init__(self):
        self.id: str
        self.states: set[str] = set()
        self.alphabet: set[str] = set()
        self.transition_function: dict[str, set[tuple[str, str]]] = dict()
        self.initial_states: set[str] = set()
        self.accepting_states: set[str] = set()
        self.error_states: set[str] = set()
    
    def __str__(self):
        transitions_str = ""
        for state, trans_set in self.transition_function.items():
            for symbol, dest in trans_set:
                transitions_str += f"    {state} --{symbol}--> {dest}\n"

        return (
            f"DeterministicFiniteAutomaton(id={getattr(self, 'id', None)})\n"
            f"States: {sorted(self.states)}\n"
            f"Input Symbols: {sorted(self.alphabet)}\n"
            f"Initial States: {sorted(self.initial_states)}\n"
            f"Accepting States: {sorted(self.accepting_states)}\n"
            f"Transitions:\n{transitions_str if transitions_str else '    None'}"
        )

    def updateSingleDFA(self):
        transitions = self.transition_function.copy()
        self.states.add(("ERROR_STATE"))
        self.error_states.add(("ERROR_STATE"))
        transitions[("ERROR_STATE")] = set()
        
        for state in self.states:
            if state not in transitions:
                transitions[state] = set()

        for state in transitions: 
            existing_transitions = set()
            for transition, target in transitions[state]: 
                existing_transitions.add(transition)
            #print(existing_transitions, self.alphabet)
            for transition in self.alphabet - existing_transitions:
                transitions[state].add((transition,("ERROR_STATE")))
                

        self.transition_function = transitions

    def init_multi_process_dfa(self, states, alphabet, transition_function, initial_states, accepting_states, error_states):
        self.id = "multi_process_DFA"
        self.states = states
        self.alphabet = alphabet
        self.transition_function = transition_function
        self.initial_states = initial_states
        self.accepting_states = accepting_states
        self.error_states = error_states
        return self

    def init_constraint_dfa(self, constraint: ConstraintData, multi_process_alphabet):
        if constraint.constraintType == "existence":
            return self.existenceDFA(constraint.id, constraint.sourceRef, multi_process_alphabet)
        elif constraint.constraintType == "absence2":
            return self.absence2DFA(constraint.id, constraint.sourceRef, multi_process_alphabet)
        elif constraint.constraintType == "choice":
            return self.choiceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "exc-choice":
            return self.exc_choiceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "resp-existence":
            return self.resp_existenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "coexistence":
            return self.coexistenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "response":
            return self.responseDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "precedence":
            return self.precedenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "succession":
            return self.successionDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "alt-response":
            return self.alt_responseDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "alt-precedence":
            return self.alt_precedenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "alt-precedence":
            return self.alt_successionDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "chain-response":
            return self.chain_responseDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "chain-precedence":
            return self.chain_precedenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "chain-succession":
            return self.chain_successionDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "not-coexistence":
            return self.not_coexistenceDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "neg-succession":
            return self.neg_successionDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        elif constraint.constraintType == "neg-chain-succession":
            return self.neg_chain_successionDFA(constraint.id, constraint.sourceRef, constraint.targetRef, multi_process_alphabet)
        else:
            print("Unknown constraint type:", constraint.constraintType)

    def existenceDFA(self, id, source, multi_process_alphabet):
            # existence(p), F(p)

            # existenceTemplate = [
            #     "",
            #     {"existence_1", "existence_2"},

            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "existence_1": {},  # p into existence_2
            #         "existence_2": {},  # empty
            #     },
            #     {"existence_1"},
            #     {"existence_2"}
            # ]
            #self = existenceTemplate
            
            self.id = id
            self.states = {"existence_1", "existence_2"}
            self.alphabet = multi_process_alphabet
            self.transition_function["existence_1"] = set()
            self.transition_function["existence_2"] = set()
            for activity in multi_process_alphabet:
                if activity == source:
                    self.transition_function["existence_1"].add((activity, "existence_2"))
                if activity != source:
                    self.transition_function["existence_1"].add((activity, "existence_1"))
                self.transition_function["existence_2"].add((activity, "existence_2"))
            self.initial_states = {"existence_1"}
            self.accepting_states = {"existence_2"}
            self.error_states = set()
            return self

    def absence2DFA(self, id, source, multi_process_alphabet):
            # # absence2(p), !F(p&XF(p))

            # absence2Template = [
            #     "",
            #     {"absence2_1", "absence2_2", "absence2_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "absence2_1": {},  # p into absence2_2
            #         "absence2_2": {},  # p into absence2_3
            #         "absence2_3": {},  # empty
            #     },
            #     {"absence2_1"},
            #     {"absence2_1", "absence2_2"}
            # ]
            # #dfa = absence2Template

            self.id = id
            self.states = {"absence2_1", "absence2_2", "absence2_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["absence2_1"] = set()
            self.transition_function["absence2_2"] = set()
            self.transition_function["absence2_3"] = set()
            for activity in multi_process_alphabet:
                if activity == source:
                    self.transition_function["absence2_1"].add((activity, "absence2_2"))
                    self.transition_function["absence2_2"].add((activity, "absence2_3"))
                if activity != source:
                    self.transition_function["absence2_1"].add((activity, "absence2_1"))
                    self.transition_function["absence2_2"].add((activity, "absence2_2"))
                self.transition_function["absence2_3"].add((activity, "absence2_3"))
            self.initial_states = {"absence2_1"}
            self.accepting_states = {"absence2_1", "absence2_2"}
            self.error_states = set()
            return self

    def choiceDFA(self, id, source, target, multi_process_alphabet):
            # # choice(p,q), F(p)|F(q)
            # choiceTemplate = [
            #     "",
            #     {"choice_1", "choice_2"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "choice_1": {},  # p or q into choice_2
            #         "choice_2": {}
            #     },
            #     {"choice_1"},
            #     {"choice_2"}
            # ]
            # dfa = choiceTemplate
            self.id = id
            self.states = {"choice_1", "choice_2"}
            self.alphabet = multi_process_alphabet
            self.transition_function["choice_1"] = set()
            self.transition_function["choice_2"] = set()
            for activity in multi_process_alphabet:
                if activity == source or activity == target:
                    self.transition_function["choice_1"].add((activity, "choice_2"))
                if activity != source and activity != target:
                    self.transition_function["choice_1"].add((activity, "choice_1"))
                self.transition_function["choice_2"].add((activity, "choice_2"))
            self.initial_states = {"choice_1"}
            self.accepting_states = {"choice_2"}
            self.error_states = set()
            return self

    def exc_choiceDFA(self, id, source, target, multi_process_alphabet):
            # exc-choice(p,q), ((F(p) | F(q)) & !((F(p) & F(q))))
            # exc_choiceTemplate = [
            #     "",
            #     {"exc-choice_1", "exc-choice_2", "exc-choice_3", "exc-choice_4"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "exc-choice_1": {},  # q & !p into exc-choice_2, p & !q into exc-choice_3, p and q into  exc-choice_4
            #         "exc-choice_2": {},  # p into exc-choice_4
            #         "exc-choice_3": {},  # q into exc-choice_4
            #         "exc-choice_4": {}
            #     },
            #     {"exc-choice_1"},
            #     {"exc-choice_2", "exc-choice_3"}
            # ]
            # dfa = exc_choiceTemplate
            self.id = id
            self.states = {"exc-choice_1", "exc-choice_2", "exc-choice_3", "exc-choice_4"}
            self.alphabet = multi_process_alphabet
            self.transition_function["exc-choice_1"] = set()
            self.transition_function["exc-choice_2"] = set()
            self.transition_function["exc-choice_3"] = set()
            self.transition_function["exc-choice_4"] = set()
            for activity in multi_process_alphabet:
                if activity == target and activity != source:
                    self.transition_function["exc-choice_1"].add((activity, "exc-choice_2"))
                if activity == source and activity != target:
                    self.transition_function["exc-choice_1"].add((activity, "exc-choice_3"))
                if activity == source and activity == target:
                    self.transition_function["exc-choice_1"].add((activity, "exc-choice_4"))
                if activity != source and activity != target:
                    self.transition_function["exc-choice_1"].add((activity, "exc-choice_1"))
                if activity == source:
                    self.transition_function["exc-choice_2"].add((activity, "exc-choice_4"))
                if activity == target:
                    self.transition_function["exc-choice_3"].add((activity, "exc-choice_4"))
                if activity != source:
                    self.transition_function["exc-choice_2"].add((activity, "exc-choice_2"))
                if activity != target:
                    self.transition_function["exc-choice_3"].add((activity, "exc-choice_3"))
                self.transition_function["exc-choice_4"].add((activity, "exc-choice_4"))
            self.initial_states = {"exc-choice_1"}
            self.accepting_states = {"exc-choice_2", "exc-choice_3"}
            self.error_states = set()
            return self

    def resp_existenceDFA(self, id, source, target, multi_process_alphabet):
            # # resp-existence(p,q), (F(p) -> F(q))
            # resp_existenceTemplate = [
            #     "",
            #     {"resp-existence_1", "resp-existence_2", "resp-existence_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "resp-existence_1": {},  # q into resp-existence_2, p & !q into resp-existence_3
            #         "resp-existence_2": {},  # empty
            #         "resp-existence_3": {},  # q into resp-existence_2
            #     },
            #     {"resp-existence_1"},
            #     {"resp-existence_1", "resp-existence_2"}
            # ]
            # dfa = resp_existenceTemplate
            self.id = id
            self.states = {"resp-existence_1", "resp-existence_2", "resp-existence_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["resp-existence_1"] = set()
            self.transition_function["resp-existence_2"] = set()
            self.transition_function["resp-existence_3"] = set()
            for activity in multi_process_alphabet:
                if activity == target:
                    self.transition_function["resp-existence_1"].add((activity, "resp-existence_2"))
                    self.transition_function["resp-existence_3"].add((activity, "resp-existence_2"))
                if activity == source and activity != target:
                    self.transition_function["resp-existence_1"].add((activity, "resp-existence_3"))
                if activity != source and activity != target:
                    self.transition_function["resp-existence_1"].add((activity, "resp-existence_1"))
                if activity != target:
                    self.transition_function["resp-existence_3"].add((activity, "resp-existence_3"))
                self.transition_function["resp-existence_2"].add((activity, "resp-existence_2"))
            self.initial_states = {"resp-existence_1"}
            self.accepting_states = {"resp-existence_1", "resp-existence_2"}
            self.error_states = set()
            return self

    def coexistenceDFA(self, id, source, target, multi_process_alphabet):
            # # coexistence(p,q), (F(p) <-> F(q))
            # coexistenceTemplate = [
            #     "",
            #     {"coexistence_1", "coexistence_2", "coexistence_3", "coexistence_4"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "coexistence_1": {},  # q & !p into coexistence_2, p & !q into coexistence_3, p and q into  coexistence_4
            #         "coexistence_2": {},  # p into coexistence_4
            #         "coexistence_3": {},  # q into coexistence_4
            #         "coexistence_4": {}
            #     },
            #     {"coexistence_1"},
            #     {"coexistence_1", "coexistence_4"}
            # ]
            # dfa = coexistenceTemplate
            self.id = id
            self.states = {"coexistence_1", "coexistence_2", "coexistence_3", "coexistence_4"}
            self.alphabet = multi_process_alphabet
            self.transition_function["coexistence_1"] = set()
            self.transition_function["coexistence_2"] = set()
            self.transition_function["coexistence_3"] = set()
            self.transition_function["coexistence_4"] = set()
            for activity in multi_process_alphabet:
                if activity != target and activity != source:
                    self.transition_function["coexistence_1"].add((activity, "coexistence_1"))
                if activity == target and activity != source:
                    self.transition_function["coexistence_1"].add((activity, "coexistence_2"))
                if activity == source and activity != target:
                    self.transition_function["coexistence_1"].add((activity, "coexistence_3"))
                if activity == source and activity == target:
                    self.transition_function["coexistence_1"].add((activity, "coexistence_4"))
                if activity != source:
                    self.transition_function["coexistence_2"].add((activity, "coexistence_2"))
                if activity != target:
                    self.transition_function["coexistence_3"].add((activity, "coexistence_3"))
                if activity == source:
                    self.transition_function["coexistence_2"].add((activity, "coexistence_4"))
                if activity == target:
                    self.transition_function["coexistence_3"].add((activity, "coexistence_4"))
                self.transition_function["coexistence_4"].add((activity, "coexistence_4"))
            self.initial_states = {"coexistence_1"}
            self.accepting_states = {"coexistence_1", "coexistence_4"}
            self.error_states = set()
            return self

    def responseDFA(self, id, source, target, multi_process_alphabet):
            # # response(p,q), G((p -> F(q)))
            # responseTemplate = [
            #     "",
            #     {"response_1", "response_2"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "response_1": {},  # p & !q into response_2
            #         "response_2": {},  # q into reponse_1
            #     },
            #     {"response_1"},
            #     {"response_1"}
            # ]
            # dfa = responseTemplate
            self.id = id
            self.states = {"response_1", "response_2"}
            self.alphabet = multi_process_alphabet
            self.transition_function["response_1"] = set()
            self.transition_function["response_2"] = set()
            for activity in multi_process_alphabet:
                if activity == target or activity != source:
                    self.transition_function["response_1"].add((activity, "response_1"))
                if activity == source and activity != target:
                    self.transition_function["response_1"].add((activity, "response_2"))
                if activity != target:
                    self.transition_function["response_2"].add((activity, "response_2"))
                if activity == target:
                    self.transition_function["response_2"].add((activity, "response_1"))

            self.initial_states = {"response_1"}
            self.accepting_states = {"response_1"}
            self.error_states = set()
            return self

    def precedenceDFA(self, id, source, target, multi_process_alphabet):
            # # precedence(p,q), (!(q) W p) = (!(q) U p) | G(!q)
            # precedenceTemplate = [
            #     "",
            #     {"precedence_1", "precedence_2", "precedence_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "precedence_1": {},  # p into precedence_2, q & !p into precedence_3
            #         "precedence_2": {},  # empty
            #         "precedence_3": {},  # empty
            #     },
            #     {"precedence_1"},
            #     {"precedence_1", "precedence_2"}
            # ]
            # dfa = precedenceTemplate
            self.id = id
            self.states = {"precedence_1", "precedence_2", "precedence_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["precedence_1"] = set()
            self.transition_function["precedence_2"] = set()
            self.transition_function["precedence_3"] = set()
            for activity in multi_process_alphabet:
                if activity == target and activity != source:
                    self.transition_function["precedence_1"].add((activity, "precedence_3"))
                if activity == source:
                    self.transition_function["precedence_1"].add((activity, "precedence_2"))
                if activity != source and activity != target:
                    self.transition_function["precedence_1"].add((activity, "precedence_1"))
                self.transition_function["precedence_2"].add((activity, "precedence_2"))
                self.transition_function["precedence_3"].add((activity, "precedence_3"))
            self.initial_states = {"precedence_1"}
            self.accepting_states = {"precedence_1", "precedence_2"}
            self.error_states = set()
            return self

    def successionDFA(self, id, source, target, multi_process_alphabet):
            # # succession(p,q), (G((p -> F(q))) & (!(q) W p)) = (G((p -> F(q))) & ((!(q) U p) | G(!(q))))
            # successionTemplate = [
            #     "",
            #     {"succession_1", "succession_2", "succession_3", "succession_4"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "succession_1": {},  # q & !p into succession_2, p & !q into succession_3, p and q into  succession_4
            #         "succession_2": {},  # empty
            #         "succession_3": {},  # q into succession_4
            #         "succession_4": {}  # p & !q into succession_3
            #     },
            #     {"succession_1"},
            #     {"succession_4"}
            # ]
            # dfa = successionTemplate
            self.id = id
            self.states = {"succession_1", "succession_2", "succession_3", "succession_4"}
            self.alphabet = multi_process_alphabet
            self.transition_function["succession_1"] = set()
            self.transition_function["succession_2"] = set()
            self.transition_function["succession_3"] = set()
            self.transition_function["succession_4"] = set()
            for activity in multi_process_alphabet:
                if activity != target and activity != source:
                    self.transition_function["succession_1"].add((activity, "succession_1"))
                if activity == target and activity != source:
                    self.transition_function["succession_1"].add((activity, "succession_2"))
                if activity == source and activity != target:
                    self.transition_function["succession_1"].add((activity, "succession_3"))
                if activity == source and activity == target:
                    self.transition_function["succession_1"].add((activity, "succession_4"))
                if activity == target:
                    self.transition_function["succession_3"].add((activity, "succession_4"))
                if activity == source and activity != target:
                    self.transition_function["succession_4"].add((activity, "succession_3"))
                if activity == target or activity != source:
                    self.transition_function["succession_4"].add((activity, "succession_4"))
                if activity != target:
                    self.transition_function["succession_3"].add((activity, "succession_3"))
                self.transition_function["succession_2"].add((activity, "succession_2"))
            self.initial_states = {"succession_1"}
            self.accepting_states = {"succession_4"}
            self.error_states = set()
            return self

    def alt_responseDFA(self, id, source, target, multi_process_alphabet):
            # # alt-response(p,q), G((p -> X((!(p) U q))))
            # alt_responseTemplate = [
            #     "",
            #     {"alt-response_1", "alt-response_2", "alt-response_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "alt-response_1": {},  # p into alt-response_2
            #         "alt-response_2": {},  # p & !q into alt-response_3, q & !p into into alt-response_1
            #         "alt-response_3": {},  # empty
            #     },
            #     {"alt-response_1"},
            #     {"alt-response_1"}
            # ]
            # dfa = alt_responseTemplate
            self.id = id
            self.states = {"alt-response_1", "alt-response_2", "alt-response_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["alt-response_1"] = set()
            self.transition_function["alt-response_2"] = set()
            self.transition_function["alt-response_3"] = set()
            for activity in multi_process_alphabet:
                if activity == source:
                    self.transition_function["alt-response_1"].add((activity, "alt-response_2"))
                if activity == source and activity != target:
                    self.transition_function["alt-response_2"].add((activity, "alt-response_3"))
                if activity == target and activity != source:
                    self.transition_function["alt-response_2"].add((activity, "alt-response_1"))
                if activity != source:
                    self.transition_function["alt-response_1"].add((activity, "alt-response_1"))
                if (activity == source and activity == target) or (activity != source and activity != target):
                    self.transition_function["alt-response_2"].add((activity, "alt-response_2"))
                self.transition_function["alt-response_3"].add((activity, "alt-response_3"))
            self.initial_states = {"alt-response_1"}
            self.accepting_states = {"alt-response_1"}
            self.error_states = set()
            return self

    def alt_precedenceDFA(self, id, source, target, multi_process_alphabet):
            # # alt-precedence(p,q), ((!(q) W p) & G((q -> ~X((!(q) W p))))) = (((!(q) U p) | G(!(q))) & G((q -> WX(((!(q) U p) | G(!(q)))))))
            # alt_precedenceTemplate = [
            #     "",
            #     {"alt-precedence_1", "alt-precedence_2", "alt-precedence_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "alt-precedence_1": {},  # p & !q into alt-precedence_2, q & !p into alt-precedence_3
            #         "alt-precedence_2": {},  # q into alt-precedence_1
            #         "alt-precedence_3": {},  # empty
            #     },
            #     {"alt-precedence_1"},
            #     {"alt-precedence_1", "alt-precedence_2"}
            # ]
            # dfa = alt_precedenceTemplate
            self.id = id
            self.states = {"alt-precedence_1", "alt-precedence_2", "alt-precedence_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["alt-precedence_1"] = set()
            self.transition_function["alt-precedence_2"] = set()
            self.transition_function["alt-precedence_3"] = set()
            for activity in multi_process_alphabet:
                if (activity == source and activity == target) or (activity != source and activity != target):
                    self.transition_function["alt-precedence_1"].add((activity, "alt-precedence_1"))
                if activity == source and activity != target:
                    self.transition_function["alt-precedence_1"].add((activity, "alt-precedence_2"))
                if activity == target and activity != source:
                    self.transition_function["alt-precedence_1"].add((activity, "alt-precedence_3"))
                if activity == target:
                    self.transition_function["alt-precedence_2"].add((activity, "alt-precedence_1"))
                if activity != target:
                    self.transition_function["alt-precedence_2"].add((activity, "alt-precedence_2"))
                self.transition_function["alt-precedence_3"].add((activity, "alt-precedence_3"))
            self.initial_states = {"alt-precedence_1"}
            self.accepting_states = {"alt-precedence_1", "alt-precedence_2"}
            self.error_states = set()
            return self

    def alt_successionDFA(self,id,source,target,multi_process_alphabet): #G(p->X((!p)Uq))&((!q)Wp)&G(q->WX((!q)Wp)) = (G((p -> X((!(p) U q)))) & ((!(q) U p) | G(!(q))) & G((q -> WX(((!(q) U p) | G(!(q)))))))
        self.id = id
        self.states = {"alt_succession_1", "alt_succession_2", "alt_succession_3"}
        self.alphabet = multi_process_alphabet
        self.transition_function["alt_succession_1"] = set()
        self.transition_function["alt_succession_2"] = set()
        self.transition_function["alt_succession_3"] = set()
        for activity in multi_process_alphabet:
            if activity != source and activity != target:
                self.transition_function["alt_succession_1"].add((activity, "alt_succession_1"))
                self.transition_function["alt_succession_3"].add((activity, "alt_succession_3"))
            if activity == target:
                self.transition_function["alt_succession_1"].add((activity, "alt_succession_2"))
            if activity == source:
                self.transition_function["alt_succession_3"].add((activity, "alt_succession_2")) 
            if activity == source and activity != target:
                self.transition_function["alt_succession_1"].add((activity, "alt_succession_3"))
            if activity == target and activity != source:
                self.transition_function["alt_succession_3"].add((activity, "alt_succession_1"))
            self.transition_function["alt_succession_2"].add((activity, "alt_succession_2"))
        self.initial_states = {"alt_succession_1"}
        self.accepting_states ={"alt_succession_1"}
        self.error_states = set()
        return self
        
    def chain_responseDFA(self, id, source, target, multi_process_alphabet):
            # # chain-response(p,q), G((p -> X(q)))
            # chain_responseTemplate = [
            #     "",
            #     {"chain-response_1", "chain-response_2", "chain-response_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "chain-response_1": {},  # p into chain-response_2
            #         "chain-response_2": {},  # !q into chain-response_3, q & !p into chain-response_1
            #         "chain-response_3": {},  # empty
            #     },
            #     {"chain-response_1"},
            #     {"chain-response_1"}
            # ]
            # dfa = chain_responseTemplate
            self.id = id
            self.states = {"chain-response_1", "chain-response_2", "chain-response_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["chain-response_1"] = set()
            self.transition_function["chain-response_2"] = set()
            self.transition_function["chain-response_3"] = set()
            for activity in multi_process_alphabet:
                if activity == source:
                    self.transition_function["chain-response_1"].add((activity, "chain-response_2"))
                if activity != target:
                    self.transition_function["chain-response_2"].add((activity, "chain-response_3"))
                if activity == target and activity != source:
                    self.transition_function["chain-response_2"].add((activity, "chain-response_1"))
                if activity != source:
                    self.transition_function["chain-response_1"].add((activity, "chain-response_1"))
                if (activity == source and activity == target):
                    self.transition_function["chain-response_2"].add((activity, "chain-response_2"))
                self.transition_function["chain-response_3"].add((activity, "chain-response_3"))
            self.initial_states = {"chain-response_1"}
            self.accepting_states = {"chain-response_1"}
            self.error_states = set()
            return self

    def chain_precedenceDFA(self, id, source, target, multi_process_alphabet):
            # # chain-precedence(p,q), G((X(q) -> p))
            # chain_precedenceTemplate = [
            #     "",
            #     {"chain-precedence_1", "chain-precedence_2", "chain-precedence_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "chain-precedence_1": {},  # !p into chain-precedence_2
            #         "chain-precedence_2": {},  # q into chain-precedence_3, p & !q into chain-precedence_1
            #         "chain-precedence_3": {},  # empty
            #     },
            #     {"chain-precedence_1"},
            #     {"chain-precedence_1", "chain-precedence_2"}
            # ]
            # dfa = chain_precedenceTemplate
            self.id = id
            self.states = {"chain-precedence_1", "chain-precedence_2", "chain-precedence_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["chain-precedence_1"] = set()
            self.transition_function["chain-precedence_2"] = set()
            self.transition_function["chain-precedence_3"] = set()
            for activity in multi_process_alphabet:
                if activity != source:
                    self.transition_function["chain-precedence_1"].add((activity, "chain-precedence_2"))
                if activity == target:
                    self.transition_function["chain-precedence_2"].add((activity, "chain-precedence_3"))
                if activity == source and activity != target:
                    self.transition_function["chain-precedence_2"].add((activity, "chain-precedence_1"))
                if activity == source:
                    self.transition_function["chain-precedence_1"].add((activity, "chain-precedence_1"))
                if (activity != source and activity != target):
                    self.transition_function["chain-precedence_2"].add((activity, "chain-precedence_2"))
                self.transition_function["chain-precedence_3"].add((activity, "chain-precedence_3"))
            self.initial_states = {"chain-precedence_1"}
            self.accepting_states = {"chain-precedence_1", "chain-precedence_2"}
            self.error_states = set()
            return self

    def chain_successionDFA(self, id, source, target, multi_process_alphabet):
            # # chain-succession(p,q), G((p <-> X(q)))
            # chain_successionTemplate = [
            #     "",
            #     {"chain-succession_1", "chain-succession_2", "chain-succession_3", "chain-succession_4"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "chain-succession_1": {},  # !p into chain-succession_2, p into chain-succession_3
            #         "chain-succession_2": {},  # p & !q into chain-succession_3, q into chain-succession_4
            #         "chain-succession_3": {},  # q & !p into chain-succession_2, !q into chain-succession_4
            #         "chain-succession_4": {}  # empty
            #     },
            #     {"chain-succession_1"},
            #     {"chain-succession_1", "chain-succession_2"}
            # ]
            # dfa = chain_successionTemplate
            self.id = id
            self.states = {"chain-succession_1", "chain-succession_2", "chain-succession_3", "chain-succession_4"}
            self.alphabet = multi_process_alphabet
            self.transition_function["chain-succession_1"] = set()
            self.transition_function["chain-succession_2"] = set()
            self.transition_function["chain-succession_3"] = set()
            self.transition_function["chain-succession_4"] = set()
            for activity in multi_process_alphabet:
                if activity != source:
                    self.transition_function["chain-succession_1"].add((activity, "chain-succession_2"))
                if activity == source:
                    self.transition_function["chain-succession_1"].add((activity, "chain-succession_3"))
                if activity != target:
                    self.transition_function["chain-succession_3"].add((activity, "chain-succession_4"))
                if activity == target:
                    self.transition_function["chain-succession_2"].add((activity, "chain-succession_4"))
                if activity == source and activity != target:
                    self.transition_function["chain-succession_2"].add((activity, "chain-succession_3"))
                if activity == target and activity != source:
                    self.transition_function["chain-succession_3"].add((activity, "chain-succession_2"))
                if activity != source and activity != target:
                    self.transition_function["chain-succession_2"].add((activity, "chain-succession_2"))
                if activity == source and activity == target:
                    self.transition_function["chain-succession_3"].add((activity, "chain-succession_3")) 
                self.transition_function["chain-succession_4"].add((activity, "chain-succession_4"))
            self.initial_states = {"chain-succession_1"}
            self.accepting_states = {"chain-succession_1", "chain-succession_2"}
            self.error_states = set()
            return self

    def not_coexistenceDFA(self, id, source, target, multi_process_alphabet):
            # # not-coexistence(p,q), !((F(p) & F(q)))
            # not_coexistenceTemplate = [
            #     "",
            #     {"not-coexistence_1", "not-coexistence_2", "not-coexistence_3", "not-coexistence_4"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "not-coexistence_1": {},
            #         # q & !p into not-coexistence_2, p & !q into not-coexistence_3, p & q into not-coexistence_4
            #         "not-coexistence_2": {},  # p into not-coexistence_4
            #         "not-coexistence_3": {},  # q into not-coexistence_4
            #         "not-coexistence_4": {}  # empty
            #     },
            #     {"not-coexistence_1"},
            #     {"not-coexistence_1", "not-coexistence_2", "not-coexistence_3"}
            # ]
            # dfa = not_coexistenceTemplate
            self.id = id
            self.states = {"not-coexistence_1", "not-coexistence_2", "not-coexistence_3", "not-coexistence_4"}
            self.alphabet = multi_process_alphabet
            self.transition_function["not-coexistence_1"] = set()
            self.transition_function["not-coexistence_2"] = set()
            self.transition_function["not-coexistence_3"] = set()
            self.transition_function["not-coexistence_4"] = set()
            for activity in multi_process_alphabet:
                if activity == target and activity != source:
                    self.transition_function["not-coexistence_1"].add((activity, "not-coexistence_2"))
                if activity == source and activity != target:
                    self.transition_function["not-coexistence_1"].add((activity, "not-coexistence_3"))
                if activity == source and activity == target:
                    self.transition_function["not-coexistence_1"].add((activity, "not-coexistence_4"))
                if activity == source:
                    self.transition_function["not-coexistence_2"].add((activity, "not-coexistence_4"))
                if activity == target:
                    self.transition_function["not-coexistence_3"].add((activity, "not-coexistence_4"))
                if activity != source:
                    self.transition_function["not-coexistence_2"].add((activity, "not-coexistence_2"))
                if activity != target:
                    self.transition_function["not-coexistence_3"].add((activity, "not-coexistence_3"))
                if activity != source and activity != target:
                    self.transition_function["not-coexistence_1"].add((activity, "not-coexistence_1"))
                self.transition_function["not-coexistence_4"].add((activity, "not-coexistence_4"))
            self.initial_states = {"not-coexistence_1"}
            self.accepting_states ={"not-coexistence_1", "not-coexistence_2", "not-coexistence_3"}
            self.error_states = set()
            return self

    def neg_successionDFA(self, id, source, target, multi_process_alphabet):
            # # neg-succession(p,q), G((p -> !(F(q))))
            # neg_successionTemplate = [
            #     "",
            #     {"neg-succession_1", "neg-succession_2", "neg-succession_3"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "neg-succession_1": {},  # p & !q into neg-succession_2, p & q into neg-succession_3
            #         "neg-succession_2": {},  # q into neg-succession_3
            #         "neg-succession_3": {},  # empty
            #     },
            #     {"neg-succession_1"},
            #     {"neg-succession_1", "neg-succession_2"}
            # ]
            # dfa = neg_successionTemplate
            self.id = id
            self.states = {"neg-succession_1", "neg-succession_2", "neg-succession_3"}
            self.alphabet = multi_process_alphabet
            self.transition_function["neg-succession_1"] = set()
            self.transition_function["neg-succession_2"] = set()
            self.transition_function["neg-succession_3"] = set()
            for activity in multi_process_alphabet:
                if activity == source and activity != target:
                    self.transition_function["neg-succession_1"].add((activity, "neg-succession_2"))
                if activity == source and activity == target:
                    self.transition_function["neg-succession_1"].add((activity, "neg-succession_3"))
                if activity == target:
                    self.transition_function["neg-succession_2"].add((activity, "neg-succession_3"))
                if activity != source:
                    self.transition_function["neg-succession_1"].add((activity, "neg-succession_1"))
                if activity != target:
                    self.transition_function["neg-succession_2"].add((activity, "neg-succession_2"))
                self.transition_function["neg-succession_3"].add((activity, "neg-succession_3"))
            self.initial_states = {"neg-succession_1"}
            self.accepting_states = {"neg-succession_1", "neg-succession_2"}
            self.error_states = set()
            return self

    def neg_chain_successionDFA(self, id, source, target, multi_process_alphabet):
            # # neg-chain-succession(p,q), (G((p -> WX(!(q)))) & G((q -> WX(!(p)))))
            # neg_chain_successionTemplate = [
            #     "",
            #     {"neg-chain-succession_1", "neg-chain-succession_2", "neg-chain-succession_3", "neg-chain-succession_4",
            #     "neg-chain-succession_5"},
            #     {},  # all possible inputs from the multi-process-dfa
            #     {
            #         "neg-chain-succession_1": {},
            #         # q & !p into neg-chain-succession_2, p & !q into neg-chain-succession_3, p & q into neg-chain-succession_4
            #         "neg-chain-succession_2": {},  # p into neg-chain-succession_5, !p & !q into neg-chain-succession_1
            #         "neg-chain-succession_3": {},  # q into neg-chain-succession_5, !p & !q into neg-chain-succession_1
            #         "neg-chain-succession_4": {},  # p | q into neg-chain-succession_5, !p & !q into neg-chain-succession_1
            #         "neg-chain-succession_5": {}  # empty
            #     },
            #     {"neg-chain-succession_1"},
            #     {"neg-chain-succession_1", "neg-chain-succession_2", "neg-chain-succession_3"}
            # ]
            # dfa = neg_chain_successionTemplate.copy()
            self.id = id
            self.states = {"neg-chain-succession_1", "neg-chain-succession_2", "neg-chain-succession_3" "neg-chain-succession_4","neg-chain-succession_5"}
            self.alphabet = multi_process_alphabet
            self.transition_function["neg-chain-succession_1"] = set()
            self.transition_function["neg-chain-succession_2"] = set()
            self.transition_function["neg-chain-succession_3"] = set()
            self.transition_function["neg-chain-succession_4"] = set()
            self.transition_function["neg-chain-succession_5"] = set()
            for activity in multi_process_alphabet:
                if activity != source and activity != target:
                    self.transition_function["neg-chain-succession_1"].add((activity, "neg-chain-succession_1"))
                if activity == source and activity != target:
                    self.transition_function["neg-chain-succession_3"].add((activity, "neg-chain-succession_3"))
                if activity == target and activity != source:
                    self.transition_function["neg-chain-succession_2"].add((activity, "neg-chain-succession_2"))
                if activity != source and activity == target:
                    self.transition_function["neg-chain-succession_1"].add((activity, "neg-chain-succession_2"))
                if activity != source and activity != target:
                    self.transition_function["neg-chain-succession_2"].add((activity, "neg-chain-succession_1"))
                if activity == source and activity != target:
                    self.transition_function["neg-chain-succession_1"].add((activity, "neg-chain-succession_3"))
                if activity != source and activity != target:
                    self.transition_function["neg-chain-succession_3"].add((activity, "neg-chain-succession_1"))
                if activity == target and activity == source:
                    self.transition_function["neg-chain-succession_1"].add((activity, "neg-chain-succession_4"))
                if activity != source and activity != target:
                    self.transition_function["neg-chain-succession_4"].add((activity, "neg-chain-succession_1"))
                if activity == source:
                    self.transition_function["neg-chain-succession_2"].add((activity, "neg-chain-succession_5"))
                if activity == target:
                    self.transition_function["neg-chain-succession_3"].add((activity, "neg-chain-succession_5"))
                if activity == source or activity == target:
                    self.transition_function["neg-chain-succession_4"].add((activity, "neg-chain-succession_5"))
                self.transition_function["neg-chain-succession_5"].add((activity, "neg-chain-succession_5"))
            self.initial_states = {"neg-chain-succession_1"}
            self.accepting_states = {"neg-chain-succession_1", "neg-chain-succession_2", "neg-chain-succession_3"}
            self.error_states = set()
            return self

    def add_process(self,process):
        newStates = set()
        newTransitions = {}
        newInits = set()
        newAccepting = set()
        newErrors = set()

        for init in process.initial_states:
            if self.initial_states:
                for i in self.initial_states:
                    if type(i) is str:
                        newInits.add((i, init))
                    else:
                        new = i + (init,)
                        newInits.add(new)
            else:
                newInits.add((init,))
        self.initial_states = newInits

        for accept in process.accepting_states:
            if self.accepting_states:
                for a in self.accepting_states:
                    if type(a) is str:
                        newAccepting.add((a, accept))
                    else:
                        new = a + (accept,)
                        newAccepting.add(new)
            else:
                newAccepting.add((accept,))
        self.accepting_states = newAccepting

        self.alphabet.update(process.alphabet)

        for state in process.states:
            if self.states:
                for s in self.states:
                    new_state = ()
                    if type(a) is str:
                        new_state = (s, state)
                    else:
                        new_state = s + (state,)
                    if state in process.error_states or s in self.error_states:
                        newErrors.add(new_state)
                    newStates.add(new_state)
                    #newStates.add((s, state))
                    # self.states.update(state)
                    newTransitions[new_state] = set()
                    if s in self.transition_function:
                        for t in self.transition_function[s]:
                            target = ()
                            if type(t[1]) is str:
                                target = (t[1], state)
                            else:
                                target = t[1] + (state,)
                            newTransitions[new_state].add((t[0], target))
                    if state in process.transition_function:
                        for trans in process.transition_function[state]:
                            target = ()
                            if type(s) is str:
                                target = (s, trans[1])
                            else: 
                                target = s +(trans[1],)
                            newTransitions[new_state].add((trans[0], target))
            else:
                newStates.add((state,))
                if state in process.transition_function:
                    newTransitions[(state,)] = set()
                    for trans in process.transition_function[state]:
                        newTransitions[(state,)].add((trans[0], (trans[1],)))

        self.states = newStates
        self.error_states = newErrors
        self.transition_function = newTransitions
        return self

    def add_constraint(self, constraint):
        current_elements = len(next(iter(self.states)))
        newStates = set()
        newTransitions = {}
        newInits = set()
        newAccepting = set()
        newErrors = set()
        usedStates = set()

        # Create initial states
        for init in constraint.initial_states:
            for m in self.initial_states:
                new_state = (*m, init)
                newInits.add(new_state)
                newStates.add(new_state)
        self.initial_states = newInits

        # Add inputs
        self.alphabet = set(self.alphabet) | set(constraint.alphabet)

        # Process transitions
        while usedStates != newStates:
            for state in newStates.copy():
                if state in usedStates:
                    continue
                last = len(state) - 1
                hybrid_state = state[:-1]
                if hybrid_state in self.error_states:
                    newErrors.add(state)
                constraint_state = state[-1]

                trans_hybrid = self.transition_function.get(hybrid_state, set())
                trans_constraint = constraint.transition_function.get(constraint_state, set())

                symbols_hybrid = {t[0] for t in trans_hybrid}
                symbols_constraint = {t[0] for t in trans_constraint}

                for sym, tgt in trans_hybrid:
                    matched = False
                    for sym_c, tgt_c in trans_constraint:
                        if sym == sym_c:
                            matched = True
                            next_state = (*tgt, tgt_c)
                            newStates.add(next_state)
                            newTransitions.setdefault(state, set()).add((sym, next_state))
                    if not matched:
                        next_state = (*tgt, constraint_state)
                        newStates.add(next_state)
                        newTransitions.setdefault(state, set()).add((sym, next_state))

                if not trans_constraint:
                    for sym, tgt in trans_hybrid:
                        next_state = (*tgt, constraint_state)
                        newStates.add(next_state)
                        newTransitions.setdefault(state, set()).add((sym, next_state))

                accepting = state[:current_elements]
                if accepting in self.accepting_states:
                    newAccepting.add(state)

                usedStates.add(state)

        self.error_states = newErrors
        self.states = newStates
        self.transition_function = newTransitions
        self.accepting_states = newAccepting

        return self

    def rewire_Errors(self,num_processes):
        error = tuple(("ERROR_STATE",))
        if not self.error_states or num_processes == 1:
            return self

        self.states.add(error)
        self.error_states.add(error)
        self.transition_function[error] = set()

        states = set()
        transitions = dict()
        errors = set()

        states.add(error)
        transitions[error] = set()
        errors.add(error)

        for state in self.transition_function:
            if state in self.error_states:
                continue
            else:
                transitions[state] = set()
            for transition, target in self.transition_function[state]:
                if target in self.error_states:
                    transitions[state].add((transition, error))
                else: 
                    transitions[state].add((transition, target))

        for transition in self.alphabet:
            transitions[error].add((transition, error))

        for state in self.states:
            if state not in self.error_states:
                states.add(state)

        self.states = states
        self.transition_function = transitions
        self.error_states = errors

    def drawSingleDFA(self,name):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph(name, comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph(name, comment='DFA', format='png')  
        for state in self.states:
            if state in self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            elif state in self.accepting_states:
                dot.node(str(state), shape='box', color='green')
            elif state in self.error_states:
                dot.node(str(state), shape='box', color='purple')
            else:
                dot.node(str(state), shape='box', color='black')

        for state in self.transition_function:
            has_self_loop = False
            transitions = set()
            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)
            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label="true")
                else: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
        # dot.render(directory="pic", view=False)
        # for state in self.transition_function:
        #     if next(iter(self.alphabet)) != "A":
        #         print("\n\n",self.transition_function[state])

        #     targets = dict()
        #     if self.transition_function[state] == set():
        #         dot.edge(str(state), str(state), label= "true")
        #     else:
        #         for activity, target in self.transition_function[state]:
        #             if target not in targets:
        #                 targets[target] = set()
        #             tmp = targets[target]
        #             targets[target] = tmp.add(activity)

        #         for target in targets:
        #             if next(iter(self.alphabet)) != "A":
        #                 print("\ntarget", state, target, targets[target])
        #             activities = set()
        #             target_list = set()
        #             alphabet = self.alphabet.copy()
        #             activities.add(targets[target])
        #             unused_alphabet = alphabet - activities
        #             if next(iter(self.alphabet)) != "A":
        #                 print(alphabet,activities,unused_alphabet)
        #             if len(self.alphabet) == 1:
        #                 dot.edge(str(state), str(target), label= next(iter(self.alphabet)))
        #             else: 
        #                 if unused_alphabet == None:
        #                     dot.edge(str(state), str(target), label= "true")
        #                 else:
        #                     dot.edge(str(state), str(target), label= "!(" + " | ".join(unused_alphabet) + ")")


            # has_self_loop = False
            # transition_labels = set()
            # transitions = dict()
            # for activity, target in self.transition_function[state]:
            #     if target == state:
            #         has_self_loop = True
            #         continue
            #     transition_labels.add(activity)
            #     if target not in transitions:
            #         transitions[target] = set()
            #     transitions[target] = (state,activity)
            #     #dot.edge(str(state), str(target), label=activity)
            # if has_self_loop:
            #     if len(transition_labels) == 0:
            #         dot.edge(str(state), str(state), label= "true")
            #     else: 
            #         dot.edge(str(state), str(state), label= "!(" + " | ".join(transition_labels) + ")")
            # for target in transitions:
            #     if len(target) == len(self.alphabet) and target == ("ERROR_STATE",):
            #         dot.edge(str(transitions[target][1]), str(target), label= "true")



        dot.render(directory="pic", view=False)

    def drawConstraintDFA(self,name):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph(name, comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph(name, comment='DFA', format='png')  
        for state in self.states:
            if state in self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            elif state in self.accepting_states:
                dot.node(str(state), shape='box', color='green')
            else:
                dot.node(str(state), shape='box', color='black')





        for state in self.transition_function:
            has_self_loop = False
            transitions = set()


            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)


            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label= "true")
                if len(transitions) != 0: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
            # else:
            #     dot.edge(str(state), str(state), label= "true")






        dot.render(directory="pic", view=False)

    def drawMultiDFA(self,name):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph(f"Multi_Process_DFA_{name}", comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph(f"Multi_Process_DFA_{name}", comment='DFA', format='png')  
        for state in self.states:
            if state in self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            elif state in self.accepting_states:
                dot.node(str(state), shape='box', color='green')
            elif state in self.error_states:
                dot.node(str(state), shape='box', color='purple')
            else:
                dot.node(str(state), shape='box', color='black')
        for state in self.transition_function:
            has_self_loop = False
            transitions = set()
            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)
            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label="true")
                else: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
        dot.render(directory="pic", view=False)

    def drawHybridDFA(self):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph('Hybrid_DFA', comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph('Hybrid_DFA', comment='DFA', format='png')  
        for state in self.states:
            if state in self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            elif state in self.accepting_states:
                dot.node(str(state), shape='box', color='green')
            elif state in self.error_states:
                dot.node(str(state), shape='box', color='purple')
            else:
                dot.node(str(state), shape='box', color='black')
        for state in self.transition_function:
            has_self_loop = False
            transitions = set()
            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)
            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label= "true")
                else: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
        dot.render(directory="pic", view=False)
    
class ColoredDFA():
    def __init__(self, dfa: DeterministicFiniteAutomaton):
        self.current = next(iter(dfa.initial_states)) #next(iter(dfa.initial_states))
        self.states = dfa.states
        self.alphabet = dfa.alphabet
        self.transition_function = dfa.transition_function
        self.initial_states = dfa.initial_states
        self.accepting_states = dfa.accepting_states
        self.error_states = dfa.error_states
        self.colors = dict()

    def add_colours(self,num_processes,constraint_DFAs):
        numberProcesses = num_processes
        colouredStates = {}
        stateColours = [None] * len(constraint_DFAs) #(len(constraint_DFAs) + 1)
        satisfied = "satisfied"
        violated = "violated"

        for state in self.states:
            if state in self.error_states:
                continue
            colouredStates[state] = stateColours.copy()
            for index, constraint in enumerate(constraint_DFAs):
                if state[numberProcesses + index] in constraint.accepting_states:
                    colouredStates[state][index] = {constraint.id: satisfied}
                else:
                    colouredStates[state][index] = {constraint.id: violated}
            # if violated in colouredStates[state]:
            #     colouredStates[state][len(constraint_DFAs)] = violated
            # else:
            #     colouredStates[state][len(constraint_DFAs)] = satisfied

        self.colors = colouredStates
        return self

    def changeColours(self, counter, index, constraintName, currentState, currentColour, visited):
        satisfied = "satisfied"
        violated = "violated"
        temporary_satisfied = "temporary_satisfied"
        temporary_violated = "temporary_violated"

        if currentState in visited:
            if currentState not in self.accepting_states and (self.colors[currentState][index][constraintName] == satisfied or self.colors[currentState][index][constraintName] == violated) and currentState in self.transition_function:
                counter += 1
                reachableColours = {self.colors[target[1]][index][constraintName] for target in self.transition_function[currentState] if target[1] not in self.error_states}
                if currentColour == satisfied:
                    if violated in reachableColours or temporary_satisfied in reachableColours:
                        self.colors[currentState][index][constraintName] = temporary_satisfied
                elif currentColour == violated:
                    if satisfied in reachableColours or temporary_violated in reachableColours:
                        self.colors[currentState][index][constraintName] = temporary_violated
            return self, counter, visited

        counter += 1

        visited.add(currentState) 

        # Depth First Search to explore all reachable states
        if currentState in self.transition_function and self.transition_function[currentState]:
            for target in self.transition_function[currentState]:
                if target[1] in self.accepting_states or target[1] in self.error_states:
                    continue
                self, counter, visited_ret = self.changeColours(counter, index, constraintName, target[1], self.colors[target[1]][index][constraintName], visited.copy())
                visited = visited_ret.copy()
            reachableColours = {self.colors[target[1]][index][constraintName] for target in self.transition_function[currentState] if target[1] not in self.error_states}
            if currentColour == satisfied:
                if violated in reachableColours or temporary_satisfied in reachableColours:
                    self.colors[currentState][index][constraintName] = temporary_satisfied
            elif currentColour == violated:
                if satisfied in reachableColours or temporary_violated in reachableColours:
                    self.colors[currentState][index][constraintName] = temporary_violated
        else:
            self.colors[currentState][index][constraintName] = currentColour
        
        return self, counter, visited
    
    def changeColours2(self, counter, index, constraintName, currentState, currentColour, visited):
        counter += 1

        satisfied = "satisfied"
        violated = "violated"
        temporary_satisfied = "temporary_satisfied"
        temporary_violated = "temporary_violated"

        # Prevent infinite recursion by checking if we've already visited this state
        if currentState in visited:
            #print("Already visited", currentState)
            return self, counter
        
        visited.add(currentState)

        # Depth First Search to explore all reachable states
        if currentState in self.transition_function and self.transition_function[currentState]:
            for target in self.transition_function[currentState]:
                if target[1] not in visited:
                    self, counter = self.changeColours2(counter, index, constraintName, target[1], self.colors[target[1]][index][constraintName], visited.copy())
            reachableColours = {self.colors[target[1]][index][constraintName] for target in self.transition_function[currentState]}
            if currentColour == satisfied:
                if violated in reachableColours or temporary_satisfied in reachableColours:
                    self.colors[currentState][index][constraintName] = temporary_satisfied
            elif currentColour == violated:
                if satisfied in reachableColours or temporary_violated in reachableColours:
                    self.colors[currentState][index][constraintName] = temporary_violated
        else:
            self.colors[currentState][index][constraintName] = currentColour
        
        return self, counter
    
class ReturnColoredDFA():
    def __init__(self, dfa: ColoredDFA):
        self.current = next(iter(dfa.initial_states))
        self.states = dfa.states
        self.alphabet = dfa.alphabet
        self.transition_function = dfa.transition_function
        self.initial_states = next(iter(dfa.initial_states))
        self.accepting_states = dfa.accepting_states
        self.error_states = dfa.error_states
        self.colors = dfa.colors

    def drawColoredDFA(self):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph('colored_dfa', comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph('colored_dfa', comment='DFA', format='png')  
        for state in self.states:
            if state == self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            elif state in self.error_states:
                dot.node(str(state), shape='box', color='purple')
            else:
                worst = 0
                colour = ['green', 'yellow', 'orange', 'red']
                for constraints in self.colors[state]:
                    for value in constraints.values():
                        if value == "violated":
                            worst = 3
                        if value == "temporary_violated" and worst <= 2:
                            worst = 2
                        if value == "temporary_satisfied" and worst <= 1:
                            worst = 1
                        if value == "satisfied" and worst == 0:
                            worst = 0
                dot.node(str(state), shape='box', color=colour[worst])
        for state in self.transition_function:
            has_self_loop = False
            transitions = set()
            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)
            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label= "true")
                else: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
        dot.render(directory="pic", view=False)

    def drawColoredDFAforConstraint(self,name,index):
        limit = 80
        if len(self.states) > limit:
            dot = graphviz.Digraph(f"constraint_{name}", comment='DFA', format='png') 
            dot.node("DFA too big!", shape='box', color='red')
            dot.node(f"(number of states greater than {limit})", shape='box', color='red')
            dot.render(directory="pic", view=False)
            return
        dot = graphviz.Digraph(f"constraint_{name}", comment='DFA', format='png')  
        for state in self.states:
            if state == self.initial_states:
                dot.node(str(state), shape='box', color='blue')
            else:
                colour = ['green', 'yellow', 'orange', 'red']
                print(self.colors[state][index][name])
                if self.colors[state][index][name] == "violated":
                    dot.node(str(state), shape='box', color=colour[3])
                if self.colors[state][index][name] == "temporary_violated":
                    dot.node(str(state), shape='box', color=colour[2])
                if self.colors[state][index][name] == "temporary_satisfied":
                    dot.node(str(state), shape='box', color=colour[1])
                if self.colors[state][index][name] == "satisfied":
                    dot.node(str(state), shape='box', color=colour[0])
        for state in self.transition_function:
            has_self_loop = False
            transitions = set()
            for activity, target in self.transition_function[state]:
                if target == state:
                    has_self_loop = True
                    continue
                transitions.add(activity)
                dot.edge(str(state), str(target), label=activity)
            if has_self_loop:
                if len(transitions) == 0:
                    dot.edge(str(state), str(state), label= "true")
                else: 
                    dot.edge(str(state), str(state), label= "!(" + " | ".join(transitions) + ")")
        dot.render(directory="pic", view=False)