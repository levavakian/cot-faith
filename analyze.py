import json
import numpy as np
from utils.parse import find_last_boxed
from statsmodels.stats.contingency_tables import mcnemar
from scipy.stats.contingency import crosstab
from scipy.stats import wilcoxon 

class McNemar:
    def __init__(self):
        self.crosstab = None
        self.statistic = 0
        self.pvalue = 0
        self.exact = False

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
            "exact": bool(self.exact)
        }

    def __str__(self):
        return f"Statistic: {self.statistic}, P-value: {self.pvalue}, Exact: {self.exact}"

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

        self.wx_base_vs_unparaphrased_len = Wilcoxon()
        self.wx_base_vs_paraphrased_len = Wilcoxon()
        self.wx_base_vs_concise_len = Wilcoxon()
        self.wx_base_vs_no_nl_len = Wilcoxon()

        self.wx_unparaphrased_vs_paraphrased_steps = Wilcoxon()
        self.wx_unparaphrased_vs_concise_steps = Wilcoxon()
        self.wx_unparaphrased_vs_no_nl_steps = Wilcoxon()

    def to_json(self):
        return {
            "mc_base_vs_unparaphrased": self.mc_base_vs_unparaphrased.to_json(),
            "mc_base_vs_paraphrased": self.mc_base_vs_paraphrased.to_json(),
            "mc_base_vs_concise": self.mc_base_vs_concise.to_json(),
            "mc_base_vs_no_nl": self.mc_base_vs_no_nl.to_json()
        }
    
    def __str__(self):
        out = f"Base vs Unparaphrased: {self.mc_base_vs_unparaphrased}\nBase vs Paraphrased: {self.mc_base_vs_paraphrased}\nBase vs Concise: {self.mc_base_vs_concise}\nBase vs No NL: {self.mc_base_vs_no_nl}"
        out += f"\n\nBase vs Unparaphrased Length: {self.wx_base_vs_unparaphrased_len}\nBase vs Paraphrased Length: {self.wx_base_vs_paraphrased_len}\nBase vs Concise Length: {self.wx_base_vs_concise_len}\nBase vs No NL Length: {self.wx_base_vs_no_nl_len} "
        out += f"\n\nUnparaphrased vs Paraphrased Steps: {self.wx_unparaphrased_vs_paraphrased_steps}\nUnparaphrased vs Concise Steps: {self.wx_unparaphrased_vs_concise_steps}\nUnparaphrased vs No NL Steps: {self.wx_unparaphrased_vs_no_nl_steps}"
        return out

class Summary:
    def __init__(self):
        self.base_length = 0
        self.reworded_length = 0
        self.mean_reword_step_ratio = 0
        self.median_reword_step_ratio = 0
        self.reword_steps = 0
    
    def __str__(self):
        return f"Base Length: {self.base_length}\nReworded Length: {self.reworded_length}\nMean Reword Step Ratio: {self.mean_reword_step_ratio}\nMedian Reword Step Ratio: {self.median_reword_step_ratio}\nReword Steps: {self.reword_steps}"

    def to_json(self):
        return {
            "base_length": self.base_length,
            "reworded_length": self.reworded_length,
            "mean_reword_step_ratio": self.mean_reword_step_ratio,
            "median_reword_step_ratio": self.median_reword_step_ratio,
            "reword_steps": self.reword_steps
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
        if not self.rewordings:
            summary.base_length = len(self.output)
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
    def generate_summary(self):
        self.base.generate_summary()
        self.paraphrased.generate_summary()
        self.unparaphrased.generate_summary()
        self.concise.generate_summary()
        self.no_nl.generate_summary()
    def to_json(self):
        return {
            "base": self.base.to_json(),
            "paraphrased": self.paraphrased.to_json(),
            "unparaphrased": self.unparaphrased.to_json(),
            "concise": self.concise.to_json(),
            "no_nl": self.no_nl.to_json()
        }
    
    def __str__(self):
        return f"Base: {self.base}\nParaphrased: {self.paraphrased}\nUnparaphrased: {self.unparaphrased}\nConcise: {self.concise}"

def to_completion(response, ground_truth, rewordings=None):
    completion = Completion()
    completion.system_prompt = response[0]["content"]
    completion.user_prompt = response[1]["content"]
    completion.output = response[2]["content"]
    completion.answer = find_last_boxed(response[2]["content"])
    completion.ground_truth = ground_truth
    completion.rewordings = rewordings

    return completion

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

base_vs_unparaphrased = crosstab(base_correct, unparaphrased_correct, levels=([False, True], [False, True])).count
base_vs_paraphrased = crosstab(base_correct, paraphrased_correct, levels=([False, True], [False, True])).count
base_vs_concise = crosstab(base_correct, concise_correct, levels=([False, True], [False, True])).count
base_vs_no_nl = crosstab(base_correct, no_nl_correct, levels=([False, True], [False, True])).count

mc_unparaphrased = mcnemar(base_vs_unparaphrased, exact=True)
mc_paraphrased = mcnemar(base_vs_paraphrased, exact=True)
mc_concise = mcnemar(base_vs_concise, exact=True)
mc_no_nl = mcnemar(base_vs_no_nl, exact=True)

tests.mc_base_vs_unparaphrased.crosstab = base_vs_unparaphrased
tests.mc_base_vs_unparaphrased.statistic = mc_unparaphrased.statistic
tests.mc_base_vs_unparaphrased.pvalue = mc_unparaphrased.pvalue

tests.mc_base_vs_paraphrased.crosstab = base_vs_paraphrased
tests.mc_base_vs_paraphrased.statistic = mc_paraphrased.statistic
tests.mc_base_vs_paraphrased.pvalue = mc_paraphrased.pvalue

tests.mc_base_vs_concise.crosstab = base_vs_concise
tests.mc_base_vs_concise.statistic = mc_concise.statistic
tests.mc_base_vs_concise.pvalue = mc_concise.pvalue

tests.mc_base_vs_no_nl.crosstab = base_vs_no_nl
tests.mc_base_vs_no_nl.statistic = mc_no_nl.statistic
tests.mc_base_vs_no_nl.pvalue = mc_no_nl.pvalue

# Wilcoxon test for length

base_lengths = [len(s.base.output) for s in samples]
unparaphrased_lengths = [len(s.unparaphrased.output) for s in samples]
paraphrased_lengths = [len(s.paraphrased.output) for s in samples]
concise_lengths = [len(s.concise.output) for s in samples]
no_nl_lengths = [len(s.no_nl.output) for s in samples]

# Base vs Unparaphrased Length
wx_unparaphrased_len = wilcoxon(base_lengths, unparaphrased_lengths)
tests.wx_base_vs_unparaphrased_len.statistic = wx_unparaphrased_len.statistic
tests.wx_base_vs_unparaphrased_len.pvalue = wx_unparaphrased_len.pvalue

# Base vs Paraphrased Length
wx_paraphrased_len = wilcoxon(base_lengths, paraphrased_lengths)
tests.wx_base_vs_paraphrased_len.statistic = wx_paraphrased_len.statistic
tests.wx_base_vs_paraphrased_len.pvalue = wx_paraphrased_len.pvalue

# Base vs Concise Length
wx_concise_len = wilcoxon(base_lengths, concise_lengths)
tests.wx_base_vs_concise_len.statistic = wx_concise_len.statistic
tests.wx_base_vs_concise_len.pvalue = wx_concise_len.pvalue

# Base vs No NL Length
wx_no_nl_len = wilcoxon(base_lengths, no_nl_lengths)
tests.wx_base_vs_no_nl_len.statistic = wx_no_nl_len.statistic
tests.wx_base_vs_no_nl_len.pvalue = wx_no_nl_len.pvalue

# Wicoxon test for number of steps
unparaphrased_steps = [s.unparaphrased.summary.reword_steps if s.unparaphrased.summary else 0 for s in samples]
paraphrased_steps = [s.paraphrased.summary.reword_steps if s.paraphrased.summary else 0 for s in samples]
concise_steps = [s.concise.summary.reword_steps if s.concise.summary else 0 for s in samples]
no_nl_steps = [s.no_nl.summary.reword_steps if s.no_nl.summary else 0 for s in samples]
# Unparaphrased vs Paraphrased Steps
wx_unp_vs_par_steps = wilcoxon(unparaphrased_steps, paraphrased_steps)
tests.wx_unparaphrased_vs_paraphrased_steps.statistic = wx_unp_vs_par_steps.statistic
tests.wx_unparaphrased_vs_paraphrased_steps.pvalue = wx_unp_vs_par_steps.pvalue

# Unparaphrased vs Concise Steps
wx_unp_vs_con_steps = wilcoxon(unparaphrased_steps, concise_steps)
tests.wx_unparaphrased_vs_concise_steps.statistic = wx_unp_vs_con_steps.statistic
tests.wx_unparaphrased_vs_concise_steps.pvalue = wx_unp_vs_con_steps.pvalue

# Unparaphrased vs No NL Steps
wx_unp_vs_no_nl_steps = wilcoxon(unparaphrased_steps, no_nl_steps)
tests.wx_unparaphrased_vs_no_nl_steps.statistic = wx_unp_vs_no_nl_steps.statistic
tests.wx_unparaphrased_vs_no_nl_steps.pvalue = wx_unp_vs_no_nl_steps.pvalue

print(tests)

with open('docs/samples.json', 'w') as f:
    json.dump([s.to_json() for s in samples], f, indent=4)

with open('docs/tests.json', 'w') as f:
    json.dump(tests.to_json(), f, indent=4)
