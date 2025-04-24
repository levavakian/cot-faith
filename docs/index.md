---
layout: null
title: Document
---

<style>
  body {
    background-color: #FAF0E6;
    font-family: Georgia, serif;
    color: #333;
    margin: 0;
    padding: 0;
    font-size: 1.25em;
  }
  
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
</style>

<script id="samples-data" type="application/json">
  {% include_relative samples.json %}
</script>
<script>
  window.samples = JSON.parse(
    document.getElementById('samples-data').textContent
  );
</script>

<div class="container">
  <h1>Chain of Thought Faithfulness in Deepseek R1</h1>

  <p>Deepseek R1, and other reasoning models, <i>think</i> a lot, but it's unclear if what they say and what reasoning happens under the hood is very related.</p>

  <p>Anthropic <a href="https://www.anthropic.com/research/measuring-faithfulness-in-chain-of-thought-reasoning">investigated this</a> with prompt driven CoT on non-reasoning models, using interventions to modify the CoT to try and reveal any steganographic tricks that were happening. Next token prediction does not necessarily incentivize steganography,and indeed the study found that paraphrasing the CoT had little effect on the final accuracy</p>
  
  <p> This means that fine grained steganography is unlikely, though not impossible as it could still sneak in during RLHF.</p>
  
  <p>The study <i>did</i> find that the model engaged in post-hoc reasoning -- thinking that did not substantially change the answer even when removed. This was mostly apparent in tasks where the model could correctly answer the question without needing a CoT at all. In other words, it's easy to make up words you don't yourself heed if you don't <i>need</i> them to get the right answer.</p>

  <p>But what about reasoning models?</p>

  <p>They're trained with reinforcement learning. They're not just predicting next tokens, anymore -- they've got goals to chase and the mandate to reach them.</p>

  <p>OpenAI has <a href="https://openai.com/index/chain-of-thought-monitoring/">recently warned</a> about applying optimization pressure on CoTs for reasoning models. As long as models aren't penalized for thinking bad thoughts, there is less reason to <i>not</i> be forthright about them. If they are penalized, suddenly there's two rewards to pursue. If the easiest way to get the answer right is to cheat, but you get penalized for cheating -- well, the next best thing is to cheat and <i>get away with it</i>.</p>

  <p>Anthropic <a href="https://assets.anthropic.com/m/71876fabef0f0ed4/original/reasoning_models_paper.pdf">followed up</a> on their earlier research with a new claim. Reasoning models <i>don't</i> always say what they think. They tested this by injecting the answers to questions into the prompt itself, and then seeing if the CoT verbalized the use of the hint or not. Oftentimes it didn't, but the model would still get the question right in cases where it failed without the hint. Hmm, suspicious.</p>

  <p>Still, there's a difference between not explicitly verbalizing a hint you've been given, and thinking completely alien thoughts that you have to comport back into human language. We can't yet read the minds of these models, (<a href="https://transformer-circuits.pub/2025/attribution-graphs/biology.html">though circuit may let us get small, effortful peeks</a>), but maybe we can get more of a hint of whether the CoT is doing something human readable or not.</p>

  <p>Now that reinforcement learning trained reasoners are common, it is worth it to rerun the original Anthropic CoT faithfulness experiments to see if all is as it seems in the thoughts of Deepseek R1.</p>

  <div id="prompt-widget"></div>
  <script src="view_widget.js"></script>
  
  <script>
  const prompts     = [
    "What is 2+2?",
    "Define the Pythagorean theorem.",
    "Explain how a bubble sort works."
  ];
  const responses   = [
    "Here is my long reasoning… (could be hundreds of lines)",
    "Reasoning about Pythagoras…",
    "Step-by-step bubble sort explanation…"
  ];
  const givenAnswers = [ "4", "a^2 + b^2 = c^2", "N/A" ];
  const finalAnswers = [ "4", "a² + b² = c²", "It repeatedly swaps adjacent out-of-order items." ];
  
  // finally:
  createPromptWidget(prompts, responses, givenAnswers, finalAnswers, 'prompt-widget');
  </script>

  <!-- paraphrase-chain widget -->
  <div id="paraphrase-widget"></div>
  <script src="reword.js"></script>
  <script>
    // example chain-of-thought + paraphrases
    const originals = [
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "Here is my long reasoning… (could be hundreds of lines)",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "I then realize that 2+2 must be four because…",
      "Finally I conclude succinctly."
    ];
    const replacements = [
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "2+2 = 4",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "Sum of two and two equals four",
      "It's simply four"
    ];
    createParaphraseWidget(originals, replacements, 'paraphrase-widget');
  </script>



  <h1>Hello World</h1>
  
  This is a test
  
  This is a test
  
  This is a test
  
  This is a test
  
  This is a test
</div>
