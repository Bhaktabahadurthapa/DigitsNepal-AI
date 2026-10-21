/**
 * Starter Academy content. Drafted by the DigitsNepal build team with AI assistance; every course
 * carries a notice until a qualified educator (and, for Nepali, a native speaker) has reviewed it.
 */
export type SeedQuestion = { prompt: string; options: string[]; correctIndex: number; explanation: string };
export type SeedLesson = { title: string; objectives: string[]; minutes: number; contentMd: string; quiz: SeedQuestion[]; flashcards?: { front: string; back: string }[] };
export type SeedCourse = {
  slug: string;
  title: string;
  summary: string;
  language: "en" | "ne";
  level: "beginner" | "intermediate" | "advanced";
  audience: string;
  objectives: string[];
  availability: "available" | "coming_soon";
  modules: { title: string; summary: string; lessons: SeedLesson[] }[];
};

const NOTICE_EN = "Starter course drafted by the DigitsNepal team with AI assistance. It is awaiting review by an independent educator.";
const NOTICE_NE = "यो सुरुवाती कोर्स डिजिट्सनेपाल टोलीले एआईको सहयोगमा तयार पारेको हो। स्वतन्त्र शिक्षक र नेपाली भाषाविद्बाट समीक्षा हुन बाँकी छ।";
export const notices = { en: NOTICE_EN, ne: NOTICE_NE };

export const seedCourses: SeedCourse[] = [
  {
    slug: "introduction-to-artificial-intelligence",
    title: "Introduction to Artificial Intelligence",
    summary: "What AI is, how machine learning works, and where AI already shows up in daily life in Nepal.",
    language: "en",
    level: "beginner",
    audience: "Students, teachers and anyone curious about AI. No programming needed.",
    objectives: ["Explain what artificial intelligence is", "Describe how machine learning learns from data", "Recognise everyday AI applications and their limits"],
    availability: "available",
    modules: [
      {
        title: "What is AI?",
        summary: "Core ideas and vocabulary.",
        lessons: [
          {
            title: "AI in plain language",
            objectives: ["Define artificial intelligence", "Distinguish narrow AI from science-fiction AI"],
            minutes: 6,
            contentMd: `## What is artificial intelligence?

**Artificial intelligence (AI)** is the field of building computer systems that can do tasks that normally need human intelligence: recognising speech, translating languages, spotting patterns in pictures, or answering questions.

Most AI you use today is **narrow AI**. It is very good at one kind of task and cannot do anything else. A translation app cannot drive a car, and a chess program cannot write an essay.

## AI is not magic

AI systems do not "understand" the world the way people do. They find patterns in large amounts of data and use those patterns to make predictions. When the data is incomplete or biased, the predictions can be wrong, sometimes confidently wrong.

## Examples you may already use

- Voice typing in Nepali or English on a smartphone
- Maps that predict traffic on the Ring Road
- Spam filters in your email
- Recommendation feeds on video apps

## Key idea

AI is a set of tools built by people. Like any tool, it can help or harm depending on how it is designed and used.`,
            quiz: [
              { prompt: "Which statement best describes most AI systems in use today?", options: ["They can do any task a human can do", "They are very good at one kind of task (narrow AI)", "They understand the world exactly like people", "They work without any data"], correctIndex: 1, explanation: "Most AI today is narrow AI: strong at a specific task and unable to do unrelated tasks." },
              { prompt: "How do AI systems mostly make predictions?", options: ["By finding patterns in data", "By guessing randomly", "By reading the user's mind", "By asking a human every time"], correctIndex: 0, explanation: "AI systems learn patterns from data and use them to predict." },
              { prompt: "What can happen when an AI system is trained on biased or incomplete data?", options: ["It always becomes more accurate", "Its predictions can be wrong", "It stops working completely", "Nothing changes"], correctIndex: 1, explanation: "Poor data leads to poor, sometimes confidently wrong, predictions." },
            ],
            flashcards: [
              { front: "Artificial intelligence", back: "The field of building computer systems that do tasks that normally need human intelligence." },
              { front: "Narrow AI", back: "AI that is good at one specific kind of task." },
            ],
          },
          {
            title: "How machine learning learns",
            objectives: ["Explain training data, models and predictions", "Describe supervised learning with an example"],
            minutes: 7,
            contentMd: `## Machine learning

**Machine learning** is a way of building AI where, instead of writing every rule by hand, we let a computer learn rules from examples.

## Three key words

1. **Training data**: the examples we give the computer. For a system that recognises ripe tomatoes, this could be thousands of labelled photos.
2. **Model**: the pattern the computer learns from the data.
3. **Prediction**: the model's answer for a new example it has never seen.

## Supervised learning: an example

Imagine a cooperative in Chitwan wants to sort tomatoes. Workers label 5,000 photos as "ripe" or "not ripe". A machine learning model studies these labelled examples. Afterwards, it can look at a new photo and predict whether that tomato is ripe.

Because people provided the correct answers (labels), this is called **supervised learning**.

## Why data quality matters

If almost all training photos were taken in bright sunlight, the model may fail on photos taken indoors. A model can only be as good as the data it learned from.`,
            quiz: [
              { prompt: "In machine learning, what is training data?", options: ["The final answer from the model", "The examples the computer learns from", "The computer's hardware", "A type of internet connection"], correctIndex: 1, explanation: "Training data is the set of examples used to teach the model." },
              { prompt: "Why is the tomato example called supervised learning?", options: ["A teacher watches the computer", "People provided labels with the correct answers", "The computer works at night", "It uses no data"], correctIndex: 1, explanation: "Supervised learning uses labelled examples, the 'correct answers', provided by people." },
              { prompt: "A model trained only on sunny photos may fail on indoor photos because…", options: ["Its training data did not represent indoor conditions", "Computers dislike indoor light", "Tomatoes change colour indoors", "The model is too large"], correctIndex: 0, explanation: "Models struggle with situations not represented in their training data." },
            ],
          },
        ],
      },
      {
        title: "AI around us",
        summary: "Uses, benefits and limits.",
        lessons: [
          {
            title: "Using AI wisely",
            objectives: ["Identify benefits of AI in education and work", "Recognise limits such as errors and bias"],
            minutes: 6,
            contentMd: `## Where AI can help

- **Education:** explaining a concept in simpler words, or generating practice questions.
- **Agriculture:** predicting weather or detecting crop disease from photos.
- **Health:** helping health workers sort cases, while doctors stay responsible for decisions.
- **Languages:** translating between Nepali, English and other languages.

## Limits to remember

- **AI can be wrong.** Chatbots can produce fluent text that is false. This is sometimes called a "hallucination".
- **AI can be biased.** If training data under-represents a group, results can be unfair to that group.
- **AI does not replace responsibility.** A person must check important outputs before acting on them.

## A simple habit

Before trusting an AI answer, ask: *What is the source? Can I check it? What happens if it is wrong?*`,
            quiz: [
              { prompt: "What is an AI 'hallucination'?", options: ["A fluent answer that is false", "A computer virus", "A very fast answer", "An image filter"], correctIndex: 0, explanation: "A hallucination is confident-sounding output that is not true." },
              { prompt: "Who should be responsible for important decisions made with AI help?", options: ["The AI system", "Nobody", "A person who checks the output", "The internet provider"], correctIndex: 2, explanation: "People remain responsible and should check important outputs." },
              { prompt: "Which question helps you judge an AI answer?", options: ["Is the font nice?", "What is the source and can I check it?", "How long is the answer?", "Was it fast?"], correctIndex: 1, explanation: "Checking sources is a key habit for using AI wisely." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "prompt-engineering-fundamentals",
    title: "Prompt Engineering Fundamentals",
    summary: "Write clear prompts for AI assistants: give context, state the task, and ask for the format you need.",
    language: "en",
    level: "beginner",
    audience: "Learners and educators who use AI chat assistants.",
    objectives: ["Write clear, specific prompts", "Use context, examples and format instructions", "Check and improve AI outputs"],
    availability: "available",
    modules: [
      {
        title: "Writing good prompts",
        summary: "The building blocks of a clear prompt.",
        lessons: [
          {
            title: "Anatomy of a clear prompt",
            objectives: ["List the parts of a good prompt", "Rewrite a vague prompt into a specific one"],
            minutes: 6,
            contentMd: `## What is a prompt?

A **prompt** is the instruction you give to an AI model. Clear prompts usually get more useful answers.

## Four parts of a clear prompt

1. **Role or context:** who the answer is for. *"I teach Grade 8 science in Pokhara."*
2. **Task:** what you want. *"Explain photosynthesis."*
3. **Constraints:** length, level, language. *"In 5 short sentences, in simple Nepali."*
4. **Format:** how to present it. *"End with two practice questions."*

## Vague vs. specific

- Vague: *"Tell me about water."*
- Specific: *"Explain the water cycle for Grade 6 students in 120 words, then give one example from Nepal's monsoon."*

## Tip

If the answer is not right, do not start over. Give feedback: *"Make it shorter"*, or *"Use an example from farming."*`,
            quiz: [
              { prompt: "Which prompt is most specific?", options: ["Tell me about water.", "Explain the water cycle for Grade 6 in 120 words with a Nepal example.", "Water?", "Write something."], correctIndex: 1, explanation: "It states audience, task, length and an example to include." },
              { prompt: "Which is NOT one of the four parts of a clear prompt described in the lesson?", options: ["Context", "Task", "Format", "Password"], correctIndex: 3, explanation: "The four parts are context, task, constraints and format." },
              { prompt: "If an AI answer is not quite right, what does the lesson suggest?", options: ["Give up", "Give specific feedback to improve it", "Restart your computer", "Use capital letters"], correctIndex: 1, explanation: "Iterating with feedback is usually faster than starting over." },
            ],
          },
          {
            title: "Checking AI outputs",
            objectives: ["Verify facts in AI answers", "Avoid sharing private information in prompts"],
            minutes: 5,
            contentMd: `## Always check

AI assistants can make mistakes. Before using an answer:

- **Verify facts** such as dates, names and numbers against a trusted source.
- **Check reasoning:** does each step make sense?
- **Look for missing perspectives**, especially on topics about people or communities.

## Protect privacy

Do not paste private information into public AI tools: passwords, citizenship numbers, students' names with grades, or medical details. Many tools may store prompts.

## Ask for sources

You can ask: *"Which sources support this? Say if you are unsure."* A good assistant should admit uncertainty rather than invent a source.`,
            quiz: [
              { prompt: "Which information should you NOT paste into a public AI tool?", options: ["A general science question", "A student's name together with their grades", "A request for a poem", "A recipe question"], correctIndex: 1, explanation: "Personal data about students should not be shared with public AI tools." },
              { prompt: "What should you do with dates and numbers in an AI answer?", options: ["Trust them", "Verify them against a trusted source", "Delete them", "Double them"], correctIndex: 1, explanation: "Facts like dates and numbers should be verified." },
              { prompt: "What should a good assistant do when it is unsure?", options: ["Invent a source", "Admit uncertainty", "Stop responding", "Change the topic"], correctIndex: 1, explanation: "Admitting uncertainty is better than fabricating information." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "responsible-ai-and-digital-safety",
    title: "Responsible AI and Digital Safety",
    summary: "Stay safe online, spot scams and deepfakes, and use AI fairly and responsibly.",
    language: "en",
    level: "beginner",
    audience: "Students, parents, teachers and community members.",
    objectives: ["Recognise online scams and manipulated media", "Protect personal data", "Explain fairness and accountability in AI"],
    availability: "available",
    modules: [
      {
        title: "Staying safe",
        summary: "Practical digital safety habits.",
        lessons: [
          {
            title: "Scams, deepfakes and misinformation",
            objectives: ["Identify warning signs of scams", "Explain what a deepfake is"],
            minutes: 6,
            contentMd: `## Warning signs of scams

Scam messages often:

- create **urgency** ("Your account will close in 1 hour!"),
- ask for **OTP codes, passwords or payment**, or
- come from numbers or links you do not recognise.

Banks and wallet services in Nepal will not ask for your OTP or PIN by phone or message.

## Deepfakes

A **deepfake** is audio, image or video changed or created with AI to make someone appear to say or do something they did not. Voice deepfakes can imitate a relative asking for money.

## What to do

1. Pause. Do not act immediately.
2. Verify through another channel: call the person on a number you already know.
3. Report suspicious messages to the service provider, and to the police for fraud.`,
            quiz: [
              { prompt: "A message says your wallet will be blocked unless you share your OTP now. What is this most likely?", options: ["A normal bank request", "A scam", "A software update", "A prize"], correctIndex: 1, explanation: "Urgency plus a request for OTP is a classic scam pattern." },
              { prompt: "What is a deepfake?", options: ["A strong password", "Media created or changed with AI to show something that did not happen", "A type of antivirus", "A secure website"], correctIndex: 1, explanation: "Deepfakes are AI-manipulated or AI-generated media." },
              { prompt: "Your 'cousin' calls with a strange voice asking for money. What should you do first?", options: ["Send money quickly", "Verify by calling them on a number you already know", "Share your PIN", "Ignore all calls forever"], correctIndex: 1, explanation: "Verify through a separate, trusted channel." },
            ],
          },
          {
            title: "Fair and accountable AI",
            objectives: ["Explain bias in AI", "Describe why human oversight matters"],
            minutes: 6,
            contentMd: `## Bias

AI systems learn from data. If data mostly represents one group (for example, urban English speakers), the system may work poorly for others (for example, rural Nepali speakers). This is **bias**.

## Accountability

When an AI system affects people (for example, in admissions or loans), someone must be **accountable**: able to explain decisions, correct mistakes and listen to complaints.

## Human oversight

Responsible use keeps a **human in the loop** for important decisions. On DigitsNepal, for example, AI drafts courses but an educator must review and publish them.

## Questions to ask about any AI system

- Who built it, and with what data?
- Who could be harmed if it is wrong?
- How can a mistake be reported and fixed?`,
            quiz: [
              { prompt: "An AI speech system works well for city speakers but poorly for rural speakers. This is an example of…", options: ["Encryption", "Bias", "Compression", "Accountability"], correctIndex: 1, explanation: "Uneven performance across groups, caused by unrepresentative data, is bias." },
              { prompt: "What does 'human in the loop' mean?", options: ["A person reviews important AI outputs before they take effect", "Humans are replaced by AI", "AI runs in a loop forever", "A network cable"], correctIndex: 0, explanation: "A human reviews or approves important AI outputs." },
              { prompt: "On DigitsNepal, who publishes AI-drafted courses?", options: ["The AI automatically", "An educator after review", "Any visitor", "Nobody"], correctIndex: 1, explanation: "AI only drafts; educators review and publish." },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "introduction-to-ai-nepali",
    title: "कृत्रिम बौद्धिकताको परिचय",
    summary: "कृत्रिम बौद्धिकता (एआई) के हो, यसले कसरी सिक्छ र दैनिक जीवनमा यसको प्रयोग कहाँ हुन्छ भन्ने सरल परिचय।",
    language: "ne",
    level: "beginner",
    audience: "विद्यार्थी, शिक्षक र एआईबारे जान्न चाहने सबै।",
    objectives: ["एआई के हो भनी व्याख्या गर्ने", "मेसिन लर्निङले डाटाबाट कसरी सिक्छ बुझ्ने"],
    availability: "available",
    modules: [
      {
        title: "एआईका आधारभूत कुरा",
        summary: "मुख्य अवधारणा र शब्दावली।",
        lessons: [
          {
            title: "एआई भनेको के हो?",
            objectives: ["कृत्रिम बौद्धिकताको परिभाषा दिने", "दैनिक जीवनका एआई उदाहरण चिन्ने"],
            minutes: 6,
            contentMd: `## कृत्रिम बौद्धिकता

**कृत्रिम बौद्धिकता (एआई)** भनेको सामान्यतया मानिसको बुद्धि चाहिने काम गर्न सक्ने कम्प्युटर प्रणाली बनाउने क्षेत्र हो। जस्तै: बोली चिन्ने, भाषा अनुवाद गर्ने, तस्बिरमा ढाँचा पत्ता लगाउने वा प्रश्नको जवाफ दिने।

आज प्रयोग हुने धेरैजसो एआई **साँघुरो एआई** हो। यसले एउटा काम राम्रोसँग गर्छ तर अरू काम गर्न सक्दैन।

## दैनिक जीवनका उदाहरण

- मोबाइलमा नेपाली वा अंग्रेजी बोलेर टाइप गर्ने सुविधा
- सडकमा ट्राफिकको अनुमान गर्ने नक्सा एप
- इमेलमा स्प्याम छुट्याउने फिल्टर

## सम्झनुपर्ने कुरा

एआईले संसारलाई मानिसले जस्तै बुझ्दैन। यसले धेरै डाटामा ढाँचा खोजेर अनुमान गर्छ। डाटा अपूर्ण भए अनुमान गलत पनि हुन सक्छ।`,
            quiz: [
              { prompt: "आज प्रयोग हुने धेरैजसो एआई कस्तो हो?", options: ["सबै काम गर्न सक्ने", "एउटा काममा राम्रो साँघुरो एआई", "मानिसजस्तै सोच्ने", "डाटा बिना चल्ने"], correctIndex: 1, explanation: "धेरैजसो एआई एउटै प्रकारको काममा राम्रो साँघुरो एआई हो।" },
              { prompt: "एआईले मुख्यतया कसरी अनुमान गर्छ?", options: ["डाटामा ढाँचा खोजेर", "जथाभावी", "मान्छेको मन पढेर", "इन्टरनेट बन्द गरेर"], correctIndex: 0, explanation: "एआईले डाटाबाट सिकेका ढाँचा प्रयोग गरेर अनुमान गर्छ।" },
              { prompt: "डाटा अपूर्ण भए के हुन सक्छ?", options: ["अनुमान गलत हुन सक्छ", "एआई झन् राम्रो हुन्छ", "केही फरक पर्दैन", "कम्प्युटर बन्द हुन्छ"], correctIndex: 0, explanation: "अपूर्ण डाटाले गलत अनुमान निम्त्याउन सक्छ।" },
            ],
          },
          {
            title: "मेसिन लर्निङले कसरी सिक्छ",
            objectives: ["तालिम डाटा, मोडेल र अनुमान बुझ्ने"],
            minutes: 6,
            contentMd: `## मेसिन लर्निङ

**मेसिन लर्निङ** एआई बनाउने एउटा तरिका हो। यसमा हरेक नियम हातैले लेख्नुको सट्टा कम्प्युटरलाई उदाहरणबाट नियम सिक्न दिइन्छ।

## तीन मुख्य शब्द

1. **तालिम डाटा:** कम्प्युटरलाई दिइने उदाहरणहरू।
2. **मोडेल:** डाटाबाट कम्प्युटरले सिकेको ढाँचा।
3. **अनुमान:** नयाँ उदाहरणका लागि मोडेलले दिने जवाफ।

## उदाहरण

चितवनको एउटा सहकारीले पाकेका र नपाकेका गोलभेँडाका हजारौँ तस्बिरमा लेबल लगायो। मोडेलले ती उदाहरण अध्ययन गरेपछि नयाँ तस्बिर हेरेर गोलभेँडा पाकेको छ कि छैन भनी अनुमान गर्न सक्छ। मानिसले सही उत्तर (लेबल) दिएकाले यसलाई **सुपरभाइज्ड लर्निङ** भनिन्छ।`,
            quiz: [
              { prompt: "मेसिन लर्निङमा तालिम डाटा भनेको के हो?", options: ["कम्प्युटरले सिक्ने उदाहरणहरू", "कम्प्युटरको स्क्रिन", "इन्टरनेटको गति", "अन्तिम परीक्षा"], correctIndex: 0, explanation: "तालिम डाटा मोडेललाई सिकाउन प्रयोग हुने उदाहरण हो।" },
              { prompt: "गोलभेँडाको उदाहरणलाई सुपरभाइज्ड लर्निङ किन भनिन्छ?", options: ["मानिसले सही उत्तरसहित लेबल दिएकाले", "रातिमा चल्ने भएकाले", "डाटा नभएकाले", "शिक्षक कक्षामा भएकाले"], correctIndex: 0, explanation: "लेबल गरिएका उदाहरण प्रयोग हुने भएकाले यो सुपरभाइज्ड लर्निङ हो।" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "introduction-to-ai-agents",
    title: "Introduction to AI Agents",
    summary: "What AI agents are, how tools and planning work, and how to build safe, supervised agents.",
    language: "en",
    level: "intermediate",
    audience: "Learners who completed Introduction to AI.",
    objectives: [],
    availability: "coming_soon",
    modules: [],
  },
  {
    slug: "python-for-ai",
    title: "Python for AI",
    summary: "Python basics for data and AI: variables, lists, functions and working with simple datasets.",
    language: "en",
    level: "beginner",
    audience: "Beginners who want to start programming for AI.",
    objectives: [],
    availability: "coming_soon",
    modules: [],
  },
];
