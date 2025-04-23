import json
import numpy as np

class Completion:
    def __init__(self):
        self.output = ""
        self.answer = ""
        self.correct = False
        self.rewordings = []

class Sample:
    def __init__(self):
        self.prompt = ""
        self.base = Completion()
        self.paraphrased = Completion()
        self.unparaphrased = Completion()
        self.concise = Completion()



# Load datastore
with open('docs/datastore.json', 'r') as f:
    datastore = json.load(f)

for key, _ in datastore["aime"][key]

for key, _ in datastore["aime"].items():
    data = datastore["aime"][key]

    paraphrased = data["paraphrased"]["responses"]
    para_rewordings = data["paraphrased"]["rewordings"]
    unparaphrased = data["unparaphrased"]["responses"]
    unpara_rewordings = data["unparaphrased"]["rewordings"]
    base = data["base"]["responses"]

    print(len(para_rewordings))
    
    for i in range(len(para_rewordings)):
        tot_reword_len = 0
        tot_orig_len = 0
        for j in range(len(para_rewordings[i])):
            orig = para_rewordings[i][j][0]
            reword = para_rewordings[i][j][1]
            tot_reword_len += len(reword)
            tot_orig_len += len(orig)
            if len(orig) > 0:
                ratio = (len(reword) - len(orig)) / len(orig)
                reword_ratios.append(ratio)
        print(f"Total reword length: {tot_reword_len}, Total original length: {tot_orig_len}")


avg_reword_ratio = np.mean(reword_ratios)
print(f"Len {len(reword_ratios)} Average reword ratio: {avg_reword_ratio:.3f}")

