/* ============================================================
   MOCK DATA — no backend, everything lives in memory / localStorage-free
   ============================================================ */

const JOBS = [
  {id:1, title:"Frontend Developer", company:"NovaSoft Ltd", category:"IT & Software", location:"Nairobi", type:"Full-time", salary:"KES 80,000 - 120,000", posted:"2 days ago", deadline:"2026-08-15", logo:"NS",
    description:"NovaSoft Ltd is looking for a skilled Frontend Developer to build responsive, accessible web interfaces for our growing suite of products. You'll work closely with designers and backend engineers to ship features that thousands of users rely on daily.",
    requirements:["2+ years experience with HTML, CSS and JavaScript","Familiarity with responsive design principles","Experience with Git and version control","Strong attention to detail and UI polish","Good communication skills for a remote-friendly team"]},
  {id:2, title:"Software Engineer", company:"BrightWave Tech", category:"IT & Software", location:"Remote", type:"Full-time", salary:"KES 150,000 - 200,000", posted:"1 day ago", deadline:"2026-08-20", logo:"BW",
    description:"BrightWave Tech is hiring a Software Engineer to help design and build scalable backend services powering our job-matching engine. You will own features end-to-end, from design through deployment.",
    requirements:["3+ years backend development experience","Strong knowledge of REST APIs and databases","Experience with cloud deployment (AWS/GCP/Azure)","Comfortable working in an agile team","Bachelor's degree in Computer Science or related field"]},
  {id:3, title:"Marketing Executive", company:"PrimeRetail Group", category:"Marketing", location:"Mombasa", type:"Full-time", salary:"KES 60,000 - 90,000", posted:"3 days ago", deadline:"2026-08-10", logo:"PR",
    description:"PrimeRetail Group seeks an energetic Marketing Executive to drive campaigns across digital and traditional channels, growing brand awareness across our retail network.",
    requirements:["Diploma or degree in Marketing or related field","1-3 years marketing experience","Excellent written and verbal communication","Experience with social media management tools","Creative mindset with data-driven decision making"]},
  {id:4, title:"UI/UX Designer", company:"NovaSoft Ltd", category:"Design", location:"Nairobi", type:"Contract", salary:"KES 90,000 - 130,000", posted:"5 days ago", deadline:"2026-08-05", logo:"NS",
    description:"We're looking for a UI/UX Designer to craft intuitive, visually compelling experiences for job seekers and employers across our platform.",
    requirements:["Portfolio demonstrating strong UI/UX work","Proficiency in Figma or similar design tools","Understanding of accessibility best practices","Experience conducting user research a plus"]},
  {id:5, title:"Accountant", company:"Kilimo Finance Co.", category:"Finance", location:"Kisumu", type:"Full-time", salary:"KES 70,000 - 100,000", posted:"1 week ago", deadline:"2026-07-30", logo:"KF",
    description:"Kilimo Finance Co. is seeking a detail-oriented Accountant to manage day-to-day bookkeeping, reconciliations, and financial reporting.",
    requirements:["CPA certification or equivalent","2+ years accounting experience","Proficiency with QuickBooks or similar","High level of accuracy and integrity"]},
  {id:6, title:"Data Analyst", company:"BrightWave Tech", category:"IT & Software", location:"Remote", type:"Part-time", salary:"KES 50,000 - 75,000", posted:"4 days ago", deadline:"2026-08-12", logo:"BW",
    description:"Join BrightWave Tech as a Data Analyst to help turn recruitment data into actionable insights for employers and job seekers alike.",
    requirements:["Experience with SQL and Excel","Familiarity with data visualization tools","Analytical mindset and strong problem solving","Statistics background preferred"]},
  {id:7, title:"HR Officer", company:"PrimeRetail Group", category:"Human Resources", location:"Nairobi", type:"Full-time", salary:"KES 65,000 - 95,000", posted:"6 days ago", deadline:"2026-08-01", logo:"PR",
    description:"PrimeRetail Group needs an HR Officer to manage recruitment, onboarding, and employee relations across our regional branches.",
    requirements:["Degree in HR or related field","2+ years HR experience","Knowledge of labour laws","Strong interpersonal skills"]},
  {id:8, title:"Customer Support Agent", company:"Kilimo Finance Co.", category:"Customer Service", location:"Nakuru", type:"Full-time", salary:"KES 40,000 - 55,000", posted:"2 days ago", deadline:"2026-08-18", logo:"KF",
    description:"We're looking for a friendly, patient Customer Support Agent to help our clients resolve issues quickly over phone, email and chat.",
    requirements:["Excellent communication skills","Prior customer service experience preferred","Comfortable with support software / CRMs","Positive, solutions-oriented attitude"]}
];

const APPLICATIONS = [
  {id:1, applicant:"John Mwangi", job:"Frontend Developer", date:"2026-06-25", status:"Pending",
    email:"john.mwangi@example.com", phone:"+254 711 222 333", location:"Nairobi, Kenya",
    bio:"Frontend developer with 2 years experience building responsive interfaces with HTML, CSS and JavaScript.", skills:["HTML","CSS","JavaScript","Git"]},
  {id:2, applicant:"Amina Yusuf", job:"Frontend Developer", date:"2026-06-24", status:"Shortlisted",
    email:"amina.yusuf@example.com", phone:"+254 712 345 678", location:"Nairobi, Kenya",
    bio:"Frontend-focused developer with 3 years of experience building responsive web apps.", skills:["JavaScript","React","UI Design","Figma"]},
  {id:3, applicant:"Peter Otieno", job:"Software Engineer", date:"2026-06-23", status:"Accepted",
    email:"peter.otieno@example.com", phone:"+254 722 555 111", location:"Kisumu, Kenya",
    bio:"Backend engineer specializing in scalable REST APIs and cloud infrastructure.", skills:["Node.js","AWS","MySQL","Docker"]},
  {id:4, applicant:"Grace Wambui", job:"Marketing Executive", date:"2026-06-22", status:"Rejected",
    email:"grace.wambui@example.com", phone:"+254 733 444 222", location:"Mombasa, Kenya",
    bio:"Marketing executive with a passion for digital campaigns and brand storytelling.", skills:["SEO","Social Media","Content Strategy"]},
  {id:5, applicant:"Samuel Kiptoo", job:"UI/UX Designer", date:"2026-06-20", status:"Pending",
    email:"samuel.kiptoo@example.com", phone:"+254 700 888 999", location:"Eldoret, Kenya",
    bio:"UI/UX designer focused on accessible, user-centered product design.", skills:["Figma","Prototyping","User Research"]},
  {id:6, applicant:"Lucy Njeri", job:"Data Analyst", date:"2026-06-19", status:"Shortlisted",
    email:"lucy.njeri@example.com", phone:"+254 799 111 444", location:"Nairobi, Kenya",
    bio:"Data analyst who enjoys turning raw numbers into clear, actionable insights.", skills:["SQL","Excel","Power BI","Python"]},
  {id:7, applicant:"Brian Mutua", job:"HR Officer", date:"2026-06-18", status:"Accepted",
    email:"brian.mutua@example.com", phone:"+254 788 222 666", location:"Nairobi, Kenya",
    bio:"HR professional experienced in recruitment, onboarding and employee engagement.", skills:["Recruitment","Labour Law","Onboarding"]},
  {id:8, applicant:"Faith Chebet", job:"Customer Support Agent", date:"2026-06-17", status:"Pending",
    email:"faith.chebet@example.com", phone:"+254 710 333 777", location:"Nakuru, Kenya",
    bio:"Customer support specialist dedicated to friendly, fast issue resolution.", skills:["CRM Tools","Communication","Problem Solving"]}
];

const CONVERSATIONS = [
  {id:1, name:"NovaSoft Ltd", role:"employer", avatar:"NS", unread:2, messages:[
    {from:"them", text:"Hi Amina, thanks for applying to the Frontend Developer role!", time:"09:12 AM"},
    {from:"them", text:"Are you available for a quick call this week?", time:"09:13 AM"},
    {from:"me", text:"Hi! Yes, I'm free Wednesday afternoon.", time:"09:20 AM"},
    {from:"them", text:"Great, we'll send a calendar invite shortly.", time:"09:22 AM"}
  ]},
  {id:2, name:"BrightWave Tech", role:"employer", avatar:"BW", unread:0, messages:[
    {from:"them", text:"Thank you for your interest in the Data Analyst position.", time:"Yesterday"},
    {from:"me", text:"Thank you for considering my application!", time:"Yesterday"}
  ]},
  {id:3, name:"PrimeRetail Group", role:"employer", avatar:"PR", unread:1, messages:[
    {from:"them", text:"Your application status has been updated.", time:"2 days ago"}
  ]}
];

const EMPLOYER_CONVERSATIONS = [
  {id:1, name:"John Mwangi", role:"seeker", avatar:"JM", unread:1, messages:[
    {from:"them", text:"Hi, I just applied for the Frontend Developer role. Looking forward to hearing from you!", time:"08:40 AM"},
    {from:"me", text:"Thanks for applying, John! We'll review and get back to you soon.", time:"08:55 AM"},
    {from:"them", text:"Sounds great, thank you.", time:"09:02 AM"}
  ]},
  {id:2, name:"Amina Yusuf", role:"seeker", avatar:"AY", unread:0, messages:[
    {from:"me", text:"Hi Amina, thanks for applying to the Frontend Developer role!", time:"09:12 AM"},
    {from:"me", text:"Are you available for a quick call this week?", time:"09:13 AM"},
    {from:"them", text:"Hi! Yes, I'm free Wednesday afternoon.", time:"09:20 AM"},
    {from:"me", text:"Great, we'll send a calendar invite shortly.", time:"09:22 AM"}
  ]},
  {id:3, name:"Samuel Kiptoo", role:"seeker", avatar:"SK", unread:2, messages:[
    {from:"them", text:"Hello, is the UI/UX Designer role still open?", time:"Yesterday"},
    {from:"them", text:"I'd love to know more about the team.", time:"Yesterday"}
  ]}
];

const MY_JOBS = [
  {id:1, title:"Frontend Developer", company:"NovaSoft Ltd", location:"Nairobi", salary:"KES 80,000 - 120,000", status:"Active"},
  {id:2, title:"UI/UX Designer", company:"NovaSoft Ltd", location:"Nairobi", salary:"KES 90,000 - 130,000", status:"Active"},
  {id:3, title:"Backend Engineer", company:"NovaSoft Ltd", location:"Remote", salary:"KES 140,000 - 180,000", status:"Closed"},
  {id:4, title:"Product Intern", company:"NovaSoft Ltd", location:"Nairobi", salary:"KES 30,000 - 40,000", status:"Active"},
  {id:5, title:"QA Engineer", company:"NovaSoft Ltd", location:"Mombasa", salary:"KES 70,000 - 95,000", status:"Closed"}
];

const TESTIMONIALS = [
  {name:"Diana Achieng", role:"Hired as Software Engineer", text:"I found my current job within two weeks of signing up. The application process was simple and I could track every step."},
  {name:"Mark Kiplangat", role:"HR Manager, BrightWave Tech", text:"We cut our time-to-hire in half. Managing postings and reviewing applicants has never been this organized."},
  {name:"Sarah Njoki", role:"Hired as UI/UX Designer", text:"The search filters helped me find remote roles that matched my skills exactly. Highly recommend to any job seeker."}
];

const MY_APPLICATIONS = [
  {id:1, jobId:1, title:"Frontend Developer", company:"NovaSoft Ltd", date:"2026-06-25", status:"Pending"},
  {id:2, jobId:4, title:"UI/UX Designer", company:"NovaSoft Ltd", date:"2026-06-20", status:"Shortlisted"},
  {id:3, jobId:6, title:"Data Analyst", company:"BrightWave Tech", date:"2026-06-18", status:"Accepted"},
  {id:4, jobId:3, title:"Marketing Executive", company:"PrimeRetail Group", date:"2026-06-10", status:"Rejected"},
  {id:5, jobId:2, title:"Software Engineer", company:"BrightWave Tech", date:"2026-06-05", status:"Pending"},
  {id:6, jobId:7, title:"HR Officer", company:"PrimeRetail Group", date:"2026-05-28", status:"Rejected"}
];

const NOTIFICATIONS = [
  {icon:"fa-file-circle-check", text:"Your application for Frontend Developer was shortlisted.", time:"10 minutes ago", unread:true},
  {icon:"fa-user-plus", text:"A new candidate applied for UI/UX Designer.", time:"1 hour ago", unread:true},
  {icon:"fa-circle-check", text:"Peter Otieno's application was accepted.", time:"3 hours ago", unread:true},
  {icon:"fa-briefcase", text:"Your job posting \"Data Analyst\" is about to expire in 2 days.", time:"Yesterday", unread:false},
  {icon:"fa-bell", text:"Welcome to JobMatch! Complete your profile to get better matches.", time:"2 days ago", unread:false},
  {icon:"fa-file-lines", text:"You have 3 new applications waiting for review.", time:"3 days ago", unread:false}
];

const TEAM = [
  {name:"James Karanja", role:"Chief Executive Officer"},
  {name:"Esther Wanjiru", role:"Chief Technology Officer"},
  {name:"Daniel Omondi", role:"Head of Product"},
  {name:"Ruth Achieng", role:"Head of Partnerships"}
];
