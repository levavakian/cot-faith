import json
import numpy as np
from utils.parse import find_last_boxed
from statsmodels.stats.contingency_tables import mcnemar
from scipy.stats.contingency import crosstab

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
    
    def generate_summary(self):
        self.base.generate_summary()
        self.paraphrased.generate_summary()
        self.unparaphrased.generate_summary()
        self.concise.generate_summary()
    
    def to_json(self):
        return {
            "base": self.base.to_json(),
            "paraphrased": self.paraphrased.to_json(),
            "unparaphrased": self.unparaphrased.to_json(),
            "concise": self.concise.to_json()
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
        sample.generate_summary()
        samples.append(sample)

base_correct = [s.base.answer == s.base.ground_truth for s in samples]
unparaphrased_correct = [s.unparaphrased.answer == s.unparaphrased.ground_truth for s in samples]
paraphrased_correct = [s.paraphrased.answer == s.paraphrased.ground_truth for s in samples]
concise_correct = [s.concise.answer == s.concise.ground_truth for s in samples]

print(crosstab(base_correct, unparaphrased_correct))
mc = mcnemar(crosstab(base_correct, unparaphrased_correct), exact=True)
print(f"Base vs Unparaphrased: χ²={mc.statistic:.2f}, p={mc.pvalue:.4f}")

mc = mcnemar(crosstab(base_correct, paraphrased_correct), exact=True)
print(f"Base vs Paraphrased: χ²={mc.statistic:.2f}, p={mc.pvalue:.4f}")

mc = mcnemar(crosstab(base_correct, concise_correct), exact=True)
print(f"Base vs Concise: χ²={mc.statistic:.2f}, p={mc.pvalue:.4f}")

with open('docs/samples.json', 'w') as f:
    json.dump([s.to_json() for s in samples], f, indent=4)
