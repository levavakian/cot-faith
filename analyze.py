import json
import numpy as np
from utils.parse import find_last_boxed
from statsmodels.stats.contingency_tables import mcnemar, StratifiedTable
from scipy.stats.contingency import crosstab
from scipy.stats import wilcoxon
from statsmodels.stats.proportion import proportion_confint

class McNemar:
    def __init__(self):
        self.crosstab = None
        self.statistic = 0
        self.pvalue = 0
        self.exact = False
        self.g_lo = 0
        self.g_hi = 0

    def crosstab_to_json(self):
        return {
            "n00": int(self.crosstab[0][0]),
            "n01": int(self.crosstab[0][1]),
            "n10": int(self.crosstab[1][0]),
            "n11": int(self.crosstab[1][1])
        }
    
    def to_json(self):
        return {
            "crosstab": self.crosstab_to_json(),
            "statistic": float(self.statistic),
            "pvalue": float(self.pvalue),
            "exact": bool(self.exact),
            "g_lo": float(self.g_lo),
            "g_hi": float(self.g_hi)
        }

    def __str__(self):
        return f"Statistic: {self.statistic}, P-value: {self.pvalue}, Exact: {self.exact}, G-lo: {self.g_lo}, G-hi: {self.g_hi}"

class Wilcoxon:
    def __init__(self):
        self.statistic = 0
        self.pvalue = 0
    
    def to_json(self):
        return {
            "statistic": float(self.statistic),
            "pvalue": float(self.pvalue)
        }
    
    def __str__(self):
        return f"Statistic: {self.statistic}, P-value: {self.pvalue}"

class Tests:
    def __init__(self):
        self.mc_base_vs_unparaphrased = McNemar()
        self.mc_base_vs_paraphrased = McNemar()
        self.mc_base_vs_concise = McNemar()
        self.mc_base_vs_no_nl = McNemar()
        self.mc_nocot_vs_hidden_cot = McNemar()

        self.wx_base_vs_unparaphrased_len = Wilcoxon()
        self.wx_base_vs_paraphrased_len = Wilcoxon()
        self.wx_base_vs_concise_len = Wilcoxon()
        self.wx_base_vs_no_nl_len = Wilcoxon()

        self.wx_unparaphrased_vs_paraphrased_ratio = Wilcoxon()
        self.wx_unparaphrased_vs_concise_ratio = Wilcoxon()
        self.wx_unparaphrased_vs_no_nl_ratio = Wilcoxon()

        self.wx_unparaphrased_vs_paraphrased_steps = Wilcoxon()
        self.wx_unparaphrased_vs_concise_steps = Wilcoxon()
        self.wx_unparaphrased_vs_no_nl_steps = Wilcoxon()

    def to_json(self):
        return {
            "mc_base_vs_unparaphrased": self.mc_base_vs_unparaphrased.to_json(),
            "mc_base_vs_paraphrased": self.mc_base_vs_paraphrased.to_json(),
            "mc_base_vs_concise": self.mc_base_vs_concise.to_json(),
            "mc_base_vs_no_nl": self.mc_base_vs_no_nl.to_json(),
            "mc_nocot_vs_hidden_cot": self.mc_nocot_vs_hidden_cot.to_json()
        }
    
    def __str__(self):
        out = f"Base vs Unparaphrased: {self.mc_base_vs_unparaphrased}\nBase vs Paraphrased: {self.mc_base_vs_paraphrased}\nBase vs Concise: {self.mc_base_vs_concise}\nBase vs No NL: {self.mc_base_vs_no_nl}"
        out += f"\n\nBase vs Unparaphrased Length: {self.wx_base_vs_unparaphrased_len}\nBase vs Paraphrased Length: {self.wx_base_vs_paraphrased_len}\nBase vs Concise Length: {self.wx_base_vs_concise_len}\nBase vs No NL Length: {self.wx_base_vs_no_nl_len} "
        out += f"\n\nUnparaphrased vs Paraphrased Steps: {self.wx_unparaphrased_vs_paraphrased_steps}\nUnparaphrased vs Concise Steps: {self.wx_unparaphrased_vs_concise_steps}\nUnparaphrased vs No NL Steps: {self.wx_unparaphrased_vs_no_nl_steps}"
        out += f"\n\nNo COT vs Hidden COT: {self.mc_nocot_vs_hidden_cot}"
        out += f"\n\nUnparaphrased vs Paraphrased Ratio: {self.wx_unparaphrased_vs_paraphrased_ratio}\nUnparaphrased vs Concise Ratio: {self.wx_unparaphrased_vs_concise_ratio}\nUnparaphrased vs No NL Ratio: {self.wx_unparaphrased_vs_no_nl_ratio}"
        return out

class Summary:
    def __init__(self):
        self.base_length = 0
        self.reworded_length = 0
        self.mean_reword_step_ratio = 0
        self.median_reword_step_ratio = 0
        self.reword_steps = 0
        self.mentioned_answer_in_cot = False
    
    def __str__(self):
        return f"Base Length: {self.base_length}\nReworded Length: {self.reworded_length}\nMean Reword Step Ratio: {self.mean_reword_step_ratio}\nMedian Reword Step Ratio: {self.median_reword_step_ratio}\nReword Steps: {self.reword_steps}\nMentioned Answer in COT: {self.mentioned_answer_in_cot}"

    def to_json(self):
        return {
            "base_length": self.base_length,
            "reworded_length": self.reworded_length,
            "mean_reword_step_ratio": self.mean_reword_step_ratio,
            "median_reword_step_ratio": self.median_reword_step_ratio,
            "reword_steps": self.reword_steps,
            "mentioned_answer_in_cot": self.mentioned_answer_in_cot
        }

class Completion:
    def __init__(self):
        self.system_prompt = ""
        self.user_prompt = ""
        self.output = ""
        self.answer = ""
        self.ground_truth = ""
        self.rewordings = None
        self.summary = None
    
    def generate_summary(self):
        summary = Summary()
        output_minus_answer = self.output[:self.output.rfind(self.answer)]
        summary.mentioned_answer_in_cot = self.answer in output_minus_answer[-600:]
        summary.base_length = len(self.output)
        if not self.rewordings:
            self.summary = summary
            return
        
        r = self.rewordings[0]
        summary.base_length = len("".join(r[0] for r in self.rewordings))
        summary.reworded_length = len("".join(r[1] for r in self.rewordings))

        
        summary.mean_reword_step_ratio = np.mean([len(reword) / len(orig) if reword and orig else 1 for orig, reword in self.rewordings])
        summary.median_reword_step_ratio = np.median([len(reword) / len(orig) if reword and orig else 1 for orig, reword in self.rewordings])

        summary.reword_steps = len(self.rewordings)
        self.summary = summary
    
    def to_json(self):
        return {
            "system_prompt": self.system_prompt,
            "user_prompt": self.user_prompt,
            "output": self.output,
            "answer": self.answer,
            "ground_truth": self.ground_truth,
            "rewordings": self.rewordings,
            "summary": self.summary.to_json()
        }
    
    def __str__(self):
        return f"System prompt: {self.system_prompt}\nUser prompt: {self.user_prompt}\nOutput: {len(self.output)}\nAnswer: {len(self.answer)}\nGround truth: {len(self.ground_truth)}\nRewordings: {len(self.rewordings) if self.rewordings else 'None'}"

class Sample:
    def __init__(self):
        self.base = Completion()
        self.paraphrased = Completion()
        self.unparaphrased = Completion()
        self.concise = Completion()
        self.no_nl = Completion()
        self.hidden_cot = Completion()
        self.no_cot = Completion()

    def generate_summary(self):
        self.base.generate_summary()
        self.paraphrased.generate_summary()
        self.unparaphrased.generate_summary()
        self.concise.generate_summary()
        self.no_nl.generate_summary()
        self.hidden_cot.generate_summary()
        self.no_cot.generate_summary()

    def to_json(self):
        return {
            "base": self.base.to_json(),
            "paraphrased": self.paraphrased.to_json(),
            "unparaphrased": self.unparaphrased.to_json(),
            "concise": self.concise.to_json(),
            "no_nl": self.no_nl.to_json(),
            "hidden_cot": self.hidden_cot.to_json(),
            "no_cot": self.no_cot.to_json()
        }
    
    def __str__(self):
        return f"Base: {self.base}\nParaphrased: {self.paraphrased}\nUnparaphrased: {self.unparaphrased}\nConcise: {self.concise}\nNo NL: {self.no_nl}\nHidden COT: {self.hidden_cot}\nNo COT: {self.no_cot}"

def to_completion(response, ground_truth, rewordings=None):
    completion = Completion()
    completion.system_prompt = response[0]["content"]
    completion.user_prompt = response[1]["content"]
    completion.output = response[2]["content"]
    completion.answer = find_last_boxed(response[2]["content"])
    completion.ground_truth = ground_truth
    completion.rewordings = rewordings

    return completion

def mcnemar_and_treatment_effect(group_a, group_b):
    ct = crosstab(group_a, group_b, levels=([False, True], [False, True])).count
    target = McNemar()
    mcnemar_test = mcnemar(ct, exact=True)

    target.crosstab = ct
    target.statistic = mcnemar_test.statistic
    target.pvalue = mcnemar_test.pvalue
    target.exact = True

    b, c = ct[0][1], ct[1][0]
    p_low, p_high = proportion_confint(count=c, nobs=b+c, alpha=0.05, method="wilson")

    N = len(group_a)
    g_lo = (2*p_low - 1)*(b+c)/N
    g_hi = (2*p_high - 1)*(b+c)/N

    target.g_lo = g_lo
    target.g_hi = g_hi

    return target

def do_wilcoxon(group_a, group_b):
    w = Wilcoxon()
    wx = wilcoxon(group_a, group_b)
    w.statistic = wx.statistic
    w.pvalue = wx.pvalue
    return w

def control_for_mentioned_answer_in_cot(samples):
    # Control for cutoffs
    tables = []
    paraphrased_mentioned_in_cot = np.array([s.paraphrased.summary.mentioned_answer_in_cot for s in samples])
    for cutoff in [False, True]:
        mask = (paraphrased_mentioned_in_cot == cutoff)
        unparaphrased_correct = np.array([s.unparaphrased.answer == s.unparaphrased.ground_truth for s in samples])
        paraphrased_correct = np.array([s.paraphrased.answer == s.paraphrased.ground_truth for s in samples])
        t = [[np.sum((unparaphrased_correct==True)&(paraphrased_correct==True)&mask),
            np.sum((unparaphrased_correct==True)&(paraphrased_correct==False)&mask)],
            [np.sum((unparaphrased_correct==False)&(paraphrased_correct==True)&mask),
            np.sum((unparaphrased_correct==False)&(paraphrased_correct==False)&mask)]]
        tables.append(np.asarray(t))

    print(tables)
    st = StratifiedTable(tables)
    cmh = st.test_null_odds(correction=True)
    print("Pooled odds ratio (Mantel-Haenszel):", st.oddsratio_pooled)
    print("95 % CI:", st.oddsratio_pooled_confint())
    print(cmh)

    total_n = len(samples)
    table_0 = tables[0]
    total_0 = table_0[0][0] + table_0[0][1] + table_0[1][0] + table_0[1][1]
    print(total_0)
    table_1 = tables[1]
    total_1 = table_1[0][0] + table_1[0][1] + table_1[1][0] + table_1[1][1]
    print(total_1)

    acc_unparaphrased_no_mention = (table_0[0][0] + table_0[0][1]) / total_0
    wrong_unparaphrased_no_mention = (table_0[1][0] + table_0[1][1])
    acc_paraphrased_no_mention = (table_0[0][0] + table_0[1][0]) / total_0
    wrong_paraphrased_no_mention = (table_0[0][1] + table_0[1][1])
    gap_no_mention = acc_unparaphrased_no_mention - acc_paraphrased_no_mention
    
    acc_unparaphrased_mention = (table_1[0][0] + table_1[0][1]) / total_1
    wrong_unparaphrased_mention = (table_1[1][0] + table_1[1][1])
    acc_paraphrased_mention = (table_1[0][0] + table_1[1][0]) / total_1
    wrong_paraphrased_mention = (table_1[0][1] + table_1[1][1])
    gap_mention = acc_unparaphrased_mention - acc_paraphrased_mention

    total_wrong_unparaphrased = np.sum([1 for s in samples if s.unparaphrased.answer != s.unparaphrased.ground_truth])
    total_wrong_paraphrased = np.sum([1 for s in samples if s.paraphrased.answer != s.paraphrased.ground_truth])

    overall_gap = (acc_unparaphrased_mention - acc_paraphrased_mention) * (total_1 / total_n) + (acc_unparaphrased_no_mention - acc_paraphrased_no_mention) * (total_0 / total_n)
    print(f"Gap no mention: {gap_no_mention}")
    print(f"Gap mention: {gap_mention}")
    print("Overall gap: ", overall_gap)

    weight_0 = total_0 / total_n
    weight_1 = total_1 / total_n

    print("No Mention Contrib", weight_0 * gap_no_mention)
    print("Mention Contrib", weight_1 * gap_mention)
    
# Load datastore
with open('docs/datastore.json', 'r') as f:
    datastore = json.load(f)

samples = []

for key, _ in datastore["aime"].items():
    data = datastore["aime"][key]

    for i in range(len(data["base"]["responses"])):
        sample = Sample()
        sample.base = to_completion(data["base"]["responses"][i], data["answers"][i])
        sample.paraphrased = to_completion(data["paraphrased"]["responses"][i], data["answers"][i], data["paraphrased"]["rewordings"][i])
        sample.hidden_cot = to_completion(data["hidden"]["responses"][i], data["answers"][i])
        sample.no_cot = to_completion(data["no"]["responses"][i], data["answers"][i])
        sample.unparaphrased = to_completion(data["unparaphrased"]["responses"][i], data["answers"][i], data["unparaphrased"]["rewordings"][i])
        sample.concise = to_completion(data["concise"]["responses"][i], data["answers"][i], data["concise"]["rewordings"][i])
        sample.no_nl = to_completion(data["no_nl"]["responses"][i], data["answers"][i], data["no_nl"]["rewordings"][i])
        sample.generate_summary()
        samples.append(sample)

tests = Tests()

# McNemar tests for accuracy
base_correct = [s.base.answer == s.base.ground_truth for s in samples]
unparaphrased_correct = [s.unparaphrased.answer == s.unparaphrased.ground_truth for s in samples]
paraphrased_correct = [s.paraphrased.answer == s.paraphrased.ground_truth for s in samples]
concise_correct = [s.concise.answer == s.concise.ground_truth for s in samples]
no_nl_correct = [s.no_nl.answer == s.no_nl.ground_truth for s in samples]
hidden_cot_correct = [s.hidden_cot.answer == s.hidden_cot.ground_truth for s in samples]
no_cot_correct = [s.no_cot.answer == s.no_cot.ground_truth for s in samples]

tests.mc_base_vs_unparaphrased = mcnemar_and_treatment_effect(base_correct, unparaphrased_correct)
tests.mc_base_vs_paraphrased = mcnemar_and_treatment_effect(base_correct, paraphrased_correct)
tests.mc_base_vs_concise = mcnemar_and_treatment_effect(base_correct, concise_correct)
tests.mc_base_vs_no_nl = mcnemar_and_treatment_effect(base_correct, no_nl_correct)
tests.mc_nocot_vs_hidden_cot = mcnemar_and_treatment_effect(no_cot_correct, hidden_cot_correct)

# Wilcoxon test for length

base_lengths = [len(s.base.output) for s in samples]
unparaphrased_lengths = [len(s.unparaphrased.output) for s in samples]
paraphrased_lengths = [len(s.paraphrased.output) for s in samples]
concise_lengths = [len(s.concise.output) for s in samples]
no_nl_lengths = [len(s.no_nl.output) for s in samples]

# Base vs Unparaphrased Length
tests.wx_base_vs_unparaphrased_len = do_wilcoxon(base_lengths, unparaphrased_lengths)
# Base vs Paraphrased Length
tests.wx_base_vs_paraphrased_len = do_wilcoxon(base_lengths, paraphrased_lengths)
# Base vs Concise Length
tests.wx_base_vs_concise_len = do_wilcoxon(base_lengths, concise_lengths)
# Base vs No NL Length
tests.wx_base_vs_no_nl_len = do_wilcoxon(base_lengths, no_nl_lengths)

# Wicoxon test for number of steps
unparaphrased_steps = [s.unparaphrased.summary.reword_steps if s.unparaphrased.summary else 0 for s in samples]
paraphrased_steps = [s.paraphrased.summary.reword_steps if s.paraphrased.summary else 0 for s in samples]
concise_steps = [s.concise.summary.reword_steps if s.concise.summary else 0 for s in samples]
no_nl_steps = [s.no_nl.summary.reword_steps if s.no_nl.summary else 0 for s in samples]
# Unparaphrased vs Paraphrased Steps
tests.wx_unparaphrased_vs_paraphrased_steps = do_wilcoxon(unparaphrased_steps, paraphrased_steps)
# Unparaphrased vs Concise Steps
tests.wx_unparaphrased_vs_concise_steps = do_wilcoxon(unparaphrased_steps, concise_steps)
# Unparaphrased vs No NL Steps
tests.wx_unparaphrased_vs_no_nl_steps = do_wilcoxon(unparaphrased_steps, no_nl_steps)

tests.wx_unparaphrased_vs_paraphrased_ratio = do_wilcoxon([s.unparaphrased.summary.median_reword_step_ratio for s in samples], [s.paraphrased.summary.median_reword_step_ratio for s in samples])
tests.wx_unparaphrased_vs_concise_ratio = do_wilcoxon([s.unparaphrased.summary.median_reword_step_ratio for s in samples], [s.concise.summary.median_reword_step_ratio for s in samples])
tests.wx_unparaphrased_vs_no_nl_ratio = do_wilcoxon([s.unparaphrased.summary.median_reword_step_ratio for s in samples], [s.no_nl.summary.median_reword_step_ratio for s in samples])

intervention_types = ['base', 'unparaphrased', 'paraphrased', 'concise', 'no_nl']

print("\n--- Mentioned Answer in CoT Analysis ---")

for intervention_type in intervention_types:
    print(f"\nAnalysis for: {intervention_type}")

    successful_trials_mentioned = 0
    successful_trials_total = 0
    unsuccessful_trials_mentioned = 0
    unsuccessful_trials_total = 0

    for s in samples:
        intervention_data = getattr(s, intervention_type, None)
        is_correct = intervention_data.answer == intervention_data.ground_truth
        mentioned_answer = intervention_data.summary.mentioned_answer_in_cot

        if is_correct:
            successful_trials_total += 1
            if mentioned_answer:
                successful_trials_mentioned += 1
        else:
            unsuccessful_trials_total += 1
            if mentioned_answer:
                unsuccessful_trials_mentioned += 1

    # Calculate and print ratios
    ratio_successful = successful_trials_mentioned / successful_trials_total if successful_trials_total > 0 else 0
    ratio_unsuccessful = unsuccessful_trials_mentioned / unsuccessful_trials_total if unsuccessful_trials_total > 0 else 0

    print(f"  Successful trials: {successful_trials_mentioned}/{successful_trials_total} ({ratio_successful:.2%}) mentioned answer in CoT.")
    print(f"  Unsuccessful trials: {unsuccessful_trials_mentioned}/{unsuccessful_trials_total} ({ratio_unsuccessful:.2%}) mentioned answer in CoT.")

print("\n----------------------------------------")

control_for_mentioned_answer_in_cot(samples)

print(tests)

print("Num samples: ", len(samples))

with open('docs/samples.json', 'w') as f:
    json.dump([s.to_json() for s in samples], f, indent=4)

with open('docs/tests.json', 'w') as f:
    json.dump(tests.to_json(), f, indent=4)
