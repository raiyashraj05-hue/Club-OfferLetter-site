import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.resolve(__dirname, '../../frontend/public/template.jpg');

// ── Format date as DD/MM/YYYY ─────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return new Date().toLocaleDateString('en-GB');
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(d);
}

// ── Role classifier ────────────────────────────────────────────────────────
// BUG FIX: the old code did `p.includes('co')` to detect "Co-Lead", which
// also matches "Core Member" (contains "co" inside "Core") and "Coordinator"
// (starts with "Co"). That silently sent every Core Member / Coordinator
// appointee a Co-Lead letter. This classifier requires "co" to be directly
// attached to "lead" (co-lead / co lead / colead) before calling it Co-Lead,
// and requires "lead" to appear as its own word (not as part of another
// word) before calling it Lead. Anything else falls through to Core Member.
function classifyRole(p) {
  if (/co[\s-]?lead/.test(p)) return 'colead';
  if (/\blead\b/.test(p)) return 'lead';
  return 'core';
}

function getAcademicYear(batchStr) {
  if (!batchStr) return '2025–2026';
  const b = String(batchStr).trim();
  let startYear = 2025;
  if (/^\d{4}$/.test(b)) {
    startYear = parseInt(b, 10);
  } else if (/^\d{2}$/.test(b)) {
    startYear = 2000 + parseInt(b, 10);
  }
  return `${startYear}–${startYear + 1}`;
}

// ── Content lookup: keyed by "team|position" (lowercase, trimmed) ─────────────
// Returns { para1, para2, para3, responsibilitiesHeading, bullets, closing }
function getContent(team, position, batch) {
  const acadYear = getAcademicYear(batch);
  const t = team.toLowerCase().trim();
  const p = position.toLowerCase().trim();
  const role = classifyRole(p); // 'lead' | 'colead' | 'core'

  const key = (tk, pk) =>
    t.includes(tk) && p.includes(pk);

  // ── PANEL ──────────────────────────────────────────────────────────────────
  if (t.includes('panel') || t === '') {
    if (p.includes('president') && !p.includes('vice')) return {
      para1: `We are pleased to inform you that you have been appointed as the President of the Stats-O-Locked Club for the Academic Year ${acadYear}.`,
      para2: `This appointment recognizes your leadership qualities, dedication, and enthusiasm towards data, statistics, and collaborative growth. As President, you are entrusted with the crucial responsibility of rebuilding, restructuring, and strengthening the Stats-O-Locked Club, including revitalizing its core team and members to establish a strong, active, and sustainable organization.`,
      para3: `In your role, you will be responsible for providing strategic direction, overseeing club operations, coordinating with faculty advisors, and ensuring the smooth and effective functioning of all departments. You are also expected to foster renewed engagement among members and guide the club toward achieving its vision with a fresh and impactful approach.`,
      responsibilitiesHeading: 'Your responsibilities include:',
      bullets: [
        'Assisting with official documentation and communications',
        'Supporting event planning, coordination, and execution',
        'Helping manage internal records, follow-ups, and task tracking',
        'Ensuring timely execution of assigned responsibilities',
        'Assisting the core team in rebuilding and strengthening club operations',
      ],
      closing: `We are confident that under your leadership, the Stats-O-Locked Club will emerge stronger and more impactful, contributing significantly to academic and collaborative excellence.\n\nCongratulations on your appointment. We wish you a successful and impactful tenure.`,
    };

    if (p.includes('vice')) return {
      para1: `We are pleased to inform you that you have been appointed as the Vice President of the Stats-O-Locked Club for the Academic Year ${acadYear}.`,
      para2: `This appointment reflects our confidence in your ability to support leadership initiatives and contribute meaningfully to the club's growth. As Vice President, you will play a key role in assisting the President in rebuilding, restructuring, and strengthening the Stats-O-Locked Club, including reviving member engagement and ensuring effective coordination across all domains.`,
      para3: `In this role, you will assist in planning and execution of activities, support strategic decision-making, and assume leadership responsibilities in the absence of the President when required. Your contribution will be vital in establishing a strong operational framework and an active, collaborative club culture.`,
      responsibilitiesHeading: 'Your responsibilities include:',
      bullets: [
        'Assisting the President in rebuilding and strengthening the club structure',
        'Supporting decision-making and execution of events and initiatives',
        'Coordinating between various domains and team members',
        'Assisting in strategic and operational planning',
        'Encouraging active participation, responsibility, and teamwork among members',
      ],
      closing: `We look forward to your valuable contributions, commitment, and proactive involvement in taking the Stats-O-Locked Club forward.\n\nCongratulations, and best wishes for a productive and impactful tenure.`,
    };

    if (p.includes('general secretary') || p.includes('gen sec')) return {
      para1: `We are pleased to inform you that you have been appointed as the General Secretary of the Stats-O-Locked Club for the Academic Year ${acadYear}.`,
      para2: `This appointment recognizes your organizational skills, reliability, and attention to detail. As General Secretary, you will play a vital role in supporting the rebuilding and restructuring of the Stats-O-Locked Club, ensuring smooth administration, effective communication, and strong coordination among the core team members and faculty.`,
      para3: `In this role, you will manage official documentation, communications, meeting records, and internal coordination, which are essential for establishing a transparent, efficient, and well-functioning club structure during its revitalization phase.`,
      responsibilitiesHeading: 'Your duties include:',
      bullets: [
        'Managing and maintaining official records, notices, and correspondence',
        'Coordinating meetings and preparing agendas and minutes',
        'Supporting the planning and execution of events and initiatives',
        'Ensuring smooth and timely internal communication among members',
        'Assisting the leadership team in rebuilding and strengthening club operations',
      ],
      closing: `We are confident that you will carry out this responsibility with sincerity, professionalism, and commitment, contributing significantly to the renewed growth of the Stats-O-Locked Club.\n\nCongratulations on your appointment, and we wish you a successful and impactful tenure.`,
    };

    if (p.includes('joint secretary') || p.includes('joint sec')) return {
      para1: `We are pleased to inform you that you have been appointed as the Joint Secretary of the Stats-O-Locked Club for the Academic Year ${acadYear}.`,
      para2: `This appointment recognizes your organizational skills, reliability, and commitment to supporting the club's administration. As Joint Secretary, you will assist the General Secretary in the rebuilding and restructuring of the Stats-O-Locked Club, helping ensure smooth administration, effective communication, and strong coordination among the core team members and faculty.`,
      para3: `In this role, you will support official documentation, communications, meeting records, and internal coordination, contributing to a transparent, efficient, and well-functioning club structure during its revitalization phase.`,
      responsibilitiesHeading: 'Your duties include:',
      bullets: [
        'Assisting in managing and maintaining official records, notices, and correspondence',
        'Supporting the coordination of meetings and preparation of agendas and minutes',
        'Helping plan and execute events and initiatives',
        'Supporting smooth and timely internal communication among members',
        'Assisting the leadership team in rebuilding and strengthening club operations',
      ],
      closing: `We are confident that you will carry out this responsibility with sincerity, professionalism, and commitment, contributing significantly to the renewed growth of the Stats-O-Locked Club.\n\nCongratulations on your appointment, and we wish you a successful and impactful tenure.`,
    };

    if (p.includes('operations')) return {
      para1: `We are pleased to inform you that you have been appointed as the Operations Manager of the Stats-O-Locked Club for the Academic Year ${acadYear}.`,
      para2: `This appointment recognizes your leadership abilities, management skills, and dedication toward ensuring smooth and efficient club functioning. As Operations Manager, you will play a key role in supporting the rebuilding and restructuring of the Stats-O-Locked Club by overseeing operational activities, streamlining coordination, and ensuring the successful execution of club initiatives and events.`,
      para3: `In this role, you will be responsible for managing workflows, coordinating between departments, and ensuring that all club activities are conducted effectively and professionally during this revitalization phase.`,
      responsibilitiesHeading: 'Your duties include:',
      bullets: [
        'Overseeing the operational planning and execution of club activities and events',
        'Coordinating with different teams to ensure smooth workflow and task completion',
        'Managing timelines, logistics, and resource allocation for club initiatives',
        'Supporting the leadership team in maintaining organized and efficient operations',
        'Ensuring effective coordination and communication among all departments',
        'Assisting in rebuilding and strengthening the overall structure and functionality of the club',
      ],
      closing: `We are confident that you will carry out this responsibility with dedication, professionalism, and commitment, contributing significantly to the renewed growth and success of the Stats-O-Locked Club.\n\nCongratulations on your appointment, and we wish you a successful and impactful tenure.`,
    };
  }

  // ── PHOTOGRAPHY ────────────────────────────────────────────────────────────
  if (t.includes('photography')) {
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Team Lead of the Photography Team for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, leadership qualities, and dedication toward visual storytelling and team collaboration.`,
      para2: `As the Team Lead, you will play a crucial role in guiding the Photography Team, managing creative direction, and ensuring the successful execution of all visual content and coverage. You are expected to demonstrate strong leadership, innovation, and responsibility while fostering teamwork and excellence.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage the Photography Team effectively',
        'Plan and oversee photography coverage for events and activities',
        'Ensure high-quality visual content and timely delivery',
        'Guide team members and encourage creativity and skill development',
        'Maintain proper organization and documentation of work',
        'Stay updated with photography trends, tools, and techniques',
        'Ensure coordination with other teams and meet deadlines efficiently',
      ],
      closing: `We are confident that your leadership will strengthen the team and contribute significantly to the club's growth, while also enhancing your professional and creative journey.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'colead') return {
      para1: `We are pleased to inform you that you have been appointed as the Co-Lead of the Photography Team for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, leadership qualities, and dedication toward visual storytelling and team collaboration.`,
      para2: `As the Co-Lead, you will assist the Team Lead in guiding the Photography Team, supporting creative direction, and ensuring the successful execution of all visual content and coverage. You are expected to demonstrate strong leadership, innovation, and responsibility while fostering teamwork and excellence.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in managing the Photography Team effectively',
        'Support planning and overseeing photography coverage for events and activities',
        'Help ensure high-quality visual content and timely delivery',
        'Guide team members and encourage creativity and skill development',
        'Maintain proper organization and documentation of work',
        'Stay updated with photography trends, tools, and techniques',
        'Ensure coordination with other teams and meet deadlines efficiently',
        'Step in for the Lead when required',
      ],
      closing: `We are confident that your leadership will strengthen the team and contribute significantly to the club's growth, while also enhancing your professional and creative journey.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the Photography Team for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, dedication, and enthusiasm for visual storytelling and team collaboration.`,
      para2: `As a Core Member, you will play an important role in capturing and supporting visual content for various club activities and events. You are expected to demonstrate creativity, responsibility, and teamwork while contributing actively to the team's success.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Capture high-quality photographs for events and activities',
        'Assist in planning and executing photography coverage',
        'Edit and enhance images to maintain visual standards',
        'Collaborate with team members and contribute creative ideas',
        'Ensure proper organization and management of media files',
        'Stay updated with photography techniques and tools',
        'Follow guidelines and meet deadlines effectively',
      ],
      closing: `We are confident that your contributions will strengthen the team and help you grow creatively and professionally.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── RESEARCH ───────────────────────────────────────────────────────────────
  if (t.includes('research')) {
    if (role === 'colead') return {
      para1: `We are pleased to appoint you as the Co-Lead of the Research Team at Stats-O-Locked Club of VIT Bhopal University.`,
      para2: `Your dedication and teamwork have earned you this role, and we look forward to your continued contributions.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in managing team operations',
        'Support planning and execution of research activities',
        'Supervise team members and ensure smooth workflow',
        'Step in for the Lead when required',
        'Help organize meetings, documentation, and progress reports',
        'Maintain coordination within the team',
      ],
      closing: `We believe you will play a crucial role in strengthening the team.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to appoint you as the Lead of the Research Team at Stats-O-Locked Club of VIT Bhopal University.`,
      para2: `This position reflects your leadership potential, commitment, and capability to guide the team effectively.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage the overall functioning of the Research Team',
        'Plan, assign, and supervise research projects and tasks',
        'Ensure timely completion of work with high-quality standards',
        'Coordinate with other teams and report to higher authorities',
        'Mentor and guide Co-Leads and Core Members',
        'Take initiative in decision-making and problem-solving',
      ],
      closing: `We are confident that you will lead the team to success and uphold its vision.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to appoint you as a Core Member of the Research Team at Stats-O-Locked Club of VIT Bhopal University.`,
      para2: `Your enthusiasm and willingness to contribute make you a valuable addition to the team.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Actively participate in research tasks and projects',
        'Conduct data collection, analysis, and documentation',
        'Collaborate with team members to achieve goals',
        'Maintain accuracy, consistency, and quality in work',
        'Follow instructions and meet deadlines effectively',
      ],
      closing: `We look forward to your meaningful contributions and growth within the team.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── EVENT MANAGEMENT ───────────────────────────────────────────────────────
  if (t.includes('event')) {
    if (role === 'colead') return {
      para1: `We are pleased to inform you that you have been appointed as the Co-Lead of the Event Management Team for the academic year 2025–2026. This role recognizes your dedication, capability, and potential to support the team in achieving its goals effectively.`,
      para2: `As a Co-Lead, you will work closely with the Lead in managing team activities and ensuring the successful execution of events. Your role will be crucial in maintaining coordination within the team and supporting smooth operations across all responsibilities.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in the overall planning, organization, and execution of events',
        'Support in managing team operations and ensuring smooth workflow',
        'Coordinate tasks among Core Members and ensure proper task distribution',
        'Monitor progress of assigned activities and ensure timely completion',
        'Maintain effective communication within the team and with other stakeholders',
        'Take initiative in problem-solving and decision-making when required',
        'Step in to handle responsibilities in the absence of the Lead',
        'Contribute ideas and strategies to enhance the quality and impact of events',
      ],
      closing: `We are confident that your enthusiasm, teamwork, and leadership abilities will significantly contribute to the success and growth of the team.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Lead of the Event Management Team for the academic year 2025–2026. This position reflects our confidence in your abilities, leadership skills, and commitment to excellence.`,
      para2: `In your role as Lead, you will be responsible for guiding the team towards successful planning and execution of events. You will play a crucial role in ensuring that all activities are carried out efficiently, maintaining high standards of coordination, creativity, and teamwork. Your leadership will directly contribute to the growth, impact, and reputation of the team.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Oversee the overall functioning, planning, and management of the Event Management Team',
        'Lead the ideation, organization, and execution of events from start to finish',
        'Coordinate effectively with faculty members, administration, and other teams for smooth operations',
        'Provide direction, guidance, and mentorship to Co-Leads and Core Members',
        'Delegate responsibilities efficiently and ensure accountability within the team',
        'Monitor progress of ongoing tasks and ensure timely completion of all deliverables',
        'Maintain clear, professional, and consistent communication within the team',
        'Identify challenges proactively and take initiative to resolve them',
        'Represent the team in official meetings, discussions, and decision-making processes',
      ],
      closing: `We believe that your dedication, vision, and leadership will drive the team towards achieving excellence and creating meaningful experiences through its events.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the Event Management Team for the academic year 2025–2026. Your selection is a recognition of your potential, dedication, and willingness to contribute meaningfully to the team's vision and activities.`,
      para2: `As a Core Member, you hold an important position in the team and will be actively involved in the planning, coordination, and execution of various events. Your role is not only to perform assigned tasks but also to bring creativity, responsibility, and teamwork into every activity you undertake. The success of the team largely depends on the commitment and efforts of its core members.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Actively participate in all stages of event planning and execution',
        'Take ownership of assigned tasks and ensure their timely completion',
        'Work collaboratively with fellow Core Members, Co-Leads, and the Lead',
        'Contribute innovative ideas and creative solutions to enhance event quality',
        'Assist in logistics, coordination, and smooth on-ground execution of events',
        'Maintain clear and professional communication within the team',
        'Be proactive in identifying challenges and take initiative to resolve them',
        'Support the team in achieving its objectives with dedication and enthusiasm',
      ],
      closing: `We believe that your contribution will play a significant role in strengthening the team and ensuring the successful execution of events. This position offers you an opportunity to learn, grow, and develop valuable skills in teamwork, leadership, and event management.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── TECHNICAL ─────────────────────────────────────────────────────────────
  if (t.includes('technical') || t.includes('tech')) {
    if (role === 'colead') return {
      para1: `We are pleased to inform you that you have been appointed as the Co-Lead of the Technical Team for the academic year 2025–2026 at the Stats-O-Locked Club of VIT Bhopal University. Your selection reflects your skills, responsibility, and teamwork.`,
      para2: `As a Co-Lead, you will assist the Lead in managing the team and ensuring smooth execution of technical projects. You will play a key role in coordination and support.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in managing the team and projects',
        'Coordinate with team members and ensure task completion',
        'Support in planning and execution of technical work',
        'Provide guidance and help resolve technical issues',
        'Ensure effective communication within the team',
        'Maintain quality and meet deadlines',
      ],
      closing: `We believe your contribution will strengthen the team and ensure successful outcomes.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Lead of the Technical Team for the academic year 2025–2026 at the Stats-O-Locked Club of VIT Bhopal University. Your selection reflects your leadership, technical expertise, and dedication.`,
      para2: `As a Lead, you will be responsible for guiding the team, overseeing technical projects, and ensuring smooth execution. Your role is to inspire, manage, and drive the team towards excellence.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage the technical team effectively',
        'Oversee project development and ensure timely execution',
        'Assign tasks and monitor team progress',
        'Provide technical guidance and support to team members',
        'Ensure quality, efficiency, and innovation in all projects',
        'Maintain clear communication and coordination within the team',
      ],
      closing: `We are confident that your leadership will contribute significantly to the team's success.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the Technical Team for the academic year 2025–2026 at the Stats-O-Locked Club of VIT Bhopal University. Your selection reflects your technical skills, dedication, and enthusiasm to contribute to the team.`,
      para2: `As a Core Member, you will play a key role in developing and supporting technical projects. You are expected to bring innovation, responsibility, and teamwork to all tasks and contribute actively to the team's success.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Develop, test, and maintain technical solutions and projects',
        'Collaborate with team members and contribute innovative ideas',
        'Ensure efficiency, accuracy, and proper documentation of work',
        'Stay updated with relevant technologies',
        'Follow guidelines and meet deadlines effectively',
      ],
      closing: `We are confident that your contributions will strengthen the team and help you grow technically and professionally.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── PR / OUTREACH ──────────────────────────────────────────────────────────
  if (t.includes('pr') || t.includes('outreach')) {
    if (role === 'colead') return {
      para1: `We are pleased to inform you that you have been appointed as the Co-Lead of the PR and Outreach Team for this tenure. Your appointment reflects your enthusiasm, communication skills, and commitment to supporting the club's vision and outreach initiatives.`,
      para2: `As the Co-Lead of the PR and Outreach Team, you will play a key role in assisting the Lead in managing and guiding the team. You will help coordinate outreach activities, support communication strategies, and ensure smooth collaboration among team members.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in planning and executing PR and outreach initiatives',
        'Support the development and implementation of communication and promotion strategies',
        'Coordinate with Core Members to ensure tasks are completed efficiently and on time',
        'Help build and maintain positive relationships with students, organizations, and external partners',
        'Contribute creative ideas for outreach campaigns, promotions, and engagement activities',
        'Ensure smooth communication and collaboration within the team',
        'Represent the club professionally during outreach and networking activities',
        'Support the Lead in maintaining the team\'s productivity, coordination, and overall effectiveness',
      ],
      closing: `We believe that your contribution will be valuable in strengthening the club's outreach efforts and supporting the team's growth.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Lead of the PR and Outreach Team for this tenure. Your appointment reflects the trust placed in your leadership, communication skills, and dedication to representing the club's vision and values.`,
      para2: `As the Lead of the PR and Outreach Team, you will be responsible for guiding the team in strengthening the club's public presence and expanding its outreach. You will play a key role in shaping communication strategies, building meaningful connections, and ensuring that the club's initiatives reach a wider audience.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and supervise the PR and Outreach Team in planning and executing outreach initiatives',
        'Develop and implement effective communication and promotion strategies for the club\'s events and activities',
        'Represent the club in external communications, collaborations, and networking opportunities',
        'Build and maintain positive relationships with students, organizations, and external partners',
        'Coordinate with other teams to ensure accurate and timely dissemination of information',
        'Guide and support Core Members in carrying out their responsibilities effectively',
        'Encourage creativity, innovation, and teamwork within the PR and Outreach Team',
        'Ensure that the club\'s image and communication remain professional, clear, and impactful',
      ],
      closing: `We believe that your leadership will play a crucial role in strengthening the club's outreach and reputation.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the PR and Outreach Team for this tenure. Your selection reflects your communication abilities, enthusiasm, and commitment to representing and promoting the club's vision and initiatives effectively.`,
      para2: `As a Core Member of the PR and Outreach Team, you will play a vital role in strengthening the club's public presence and building meaningful connections with students, organizations, and the broader community.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Promote the club\'s events, initiatives, and achievements through various communication channels',
        'Assist in developing outreach strategies to expand the club\'s visibility and engagement',
        'Build and maintain positive relationships with students, organizations, and external partners',
        'Support collaborations, partnerships, and networking opportunities for the club',
        'Contribute creative ideas for campaigns, promotions, and audience engagement',
        'Coordinate with other teams to ensure accurate and timely dissemination of information',
        'Represent the club professionally in all outreach and communication activities',
        'Work collaboratively with fellow Core Members, Co-Leads, and the Lead to achieve team objectives',
      ],
      closing: `We believe that your contribution will help strengthen the club's outreach efforts and enhance its presence within and beyond the campus community.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── SOCIAL MEDIA ──────────────────────────────────────────────────────────
  if (t.includes('social')) {
    if (role === 'colead') return {
      para1: `We are pleased to inform you that you have been appointed as the Co-Lead of the Social Media Team for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, strategic thinking, and ability to engage audiences through impactful digital content.`,
      para2: `As the Co-Lead, you will assist the Social Media Lead in shaping the club's online presence, building engagement, and ensuring consistent and high-quality communication across all platforms. You are expected to demonstrate leadership, innovation, and a strong understanding of digital trends while maintaining the club's brand identity.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in managing all social media platforms of the club',
        'Support planning, creating, and scheduling engaging content',
        'Help develop and execute social media strategies for events and campaigns',
        'Monitor analytics and optimize content for better reach and engagement',
        'Maintain consistency in branding, tone, and visual identity',
        'Coordinate with design, content, and event teams',
        'Stay updated with social media trends, tools, and platform algorithms',
        'Ensure timely posting and responsiveness across platforms',
        'Step in for the Lead when required',
      ],
      closing: `We are confident that your leadership will enhance the club's digital presence and contribute significantly to its growth.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Social Media Lead for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, strategic thinking, and ability to engage audiences through impactful digital content.`,
      para2: `As the Social Media Lead, you will play a key role in shaping the club's online presence, building engagement, and ensuring consistent and high-quality communication across all platforms. You are expected to demonstrate leadership, innovation, and a strong understanding of digital trends while maintaining the club's brand identity.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage all social media platforms of the club',
        'Plan, create, and schedule engaging content',
        'Develop and execute social media strategies for events and campaigns',
        'Monitor analytics and optimize content for better reach and engagement',
        'Maintain consistency in branding, tone, and visual identity',
        'Coordinate with design, content, and event teams',
        'Stay updated with social media trends, tools, and platform algorithms',
        'Ensure timely posting and responsiveness across platforms',
      ],
      closing: `We are confident that your leadership will enhance the club's digital presence and contribute significantly to its growth.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the Social Media Team for the academic year 2025–2026 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, consistency, and enthusiasm for digital content creation and audience engagement.`,
      para2: `As a Core Member, you will support the team in executing social media activities and contribute to building the club's online presence. You are expected to demonstrate creativity, responsibility, and teamwork while learning and growing within the team.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist in creating content (posts, stories, reels) under guidance',
        'Support the execution of social media plans and campaigns',
        'Help in basic editing, caption writing, and content formatting',
        'Coordinate with team members for content collection during events',
        'Follow brand guidelines and maintain consistency in posts',
        'Stay updated with trends and suggest ideas when required',
        'Ensure timely completion of assigned tasks',
        'Support audience engagement (likes, replies, basic interactions)',
      ],
      closing: `We are confident that your contributions will strengthen the team's digital presence and help you grow creatively and professionally.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── CREATIVE ──────────────────────────────────────────────────────────────
  if (t.includes('creative')) {
    if (role === 'colead') return {
      para1: `We are delighted to inform you that you have been appointed as the Co-Lead of the Creative Team for the academic year 2026–2027. This appointment reflects our trust in your creativity, dedication, teamwork, and potential to contribute meaningfully to the growth of the team.`,
      para2: `As the Co-Lead, you will work closely with the Lead to manage the team's creative operations and ensure the successful execution of all design and branding initiatives. Your role will be essential in maintaining the quality, consistency, and innovation of the club's creative presence across events and platforms.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in planning, managing, and executing all creative activities and projects',
        'Support the development of designs, promotional content, and branding materials for events and campaigns',
        'Coordinate with Core Members to ensure efficient task allocation and workflow management',
        'Ensure timely completion of creative deliverables while maintaining quality standards',
        'Collaborate with other teams to understand and fulfill creative requirements effectively',
        'Maintain consistency in the club\'s branding, themes, and visual identity',
        'Contribute innovative ideas and creative strategies to enhance engagement and outreach',
        'Provide guidance and support to team members whenever required',
        'Step in to manage responsibilities in the absence of the Lead',
        'Promote teamwork, professionalism, and a positive creative environment within the team',
      ],
      closing: `We are confident that your enthusiasm, creativity, and collaborative spirit will play a significant role in strengthening the Creative Team and contributing to the success of the club.\n\nCongratulations on your appointment. We wish you a rewarding and successful journey as the Creative Team Co-Lead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Lead of the Creative Team for the academic year 2026–2027. This position reflects our confidence in your creativity, leadership abilities, dedication, and commitment towards delivering impactful and innovative work for the club.`,
      para2: `In your role as Lead, you will be responsible for guiding the Creative Team in developing visually engaging content and maintaining the creative identity of the club. Your contribution will play a vital role in enhancing the club's outreach, branding, and overall presence through effective design, creativity, and collaboration.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage the overall operations of the Creative Team',
        'Plan, design, and supervise creative content for events, campaigns, and social media platforms',
        'Ensure consistency in branding, themes, and visual communication',
        'Collaborate with different teams to understand creative requirements and deliver quality outputs',
        'Guide, mentor, and support team members in enhancing their creative skills',
        'Allocate tasks effectively and ensure smooth workflow within the team',
        'Review all creative deliverables before final execution or publication',
        'Encourage originality, teamwork, and innovative thinking within the team',
        'Maintain professionalism and ensure timely completion of all assigned work',
        'Contribute to strategic discussions and represent the Creative Team in official meetings when required',
      ],
      closing: `We believe that your vision, innovation, and leadership will contribute significantly to the growth and success of the team while creating meaningful and impactful creative experiences.\n\nCongratulations on your appointment. We wish you great success and a rewarding journey in your role as Lead.`,
    };
    return {
      para1: `We are pleased to inform you that you have been appointed as a Core Member of the Creative Team for the academic year 2026–2027. Your selection reflects your creativity, dedication, enthusiasm, and willingness to contribute meaningfully to the vision and activities of the team.`,
      para2: `As a Core Member, you will play an important role in supporting the team's creative initiatives and contributing to the club's branding, promotions, and visual identity. Your ideas, efforts, and commitment will help the team deliver impactful and engaging creative work across various events and platforms.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Actively participate in the planning and execution of creative projects and campaigns',
        'Assist in designing promotional materials, social media creatives, and branding content',
        'Take ownership of assigned tasks and ensure timely completion of deliverables',
        'Work collaboratively with fellow Core Members, Co-Leads, and the Lead',
        'Contribute innovative ideas and creative solutions to improve the quality of content and designs',
        'Maintain consistency in the club\'s visual identity and creative standards',
        'Support the team during event promotions, campaigns, and other creative activities',
        'Communicate effectively and professionally within the team',
        'Be proactive in learning new creative skills and adapting to responsibilities',
        'Contribute to maintaining a positive, collaborative, and productive team environment',
      ],
      closing: `We believe that your contribution will play a valuable role in strengthening the Creative Team and enhancing the club's creative presence.\n\nCongratulations on your appointment. We wish you a successful and enriching journey as a Core Member of the Creative Team.`,
    };
  }

  // ── EDITING ───────────────────────────────────────────────────────────────
  if (t.includes('editing') || t.includes('edit')) {
    if (role === 'colead') return {
      para1: `We are pleased to appoint you as the Co-Lead of the Editing Team for the academic year 2026–2027 at the Stats-O-Locked Club of VIT Bhopal University.`,
      para2: `Your creativity, dedication, and teamwork have earned you this role, and we look forward to your continued contributions toward strengthening the club's creative and digital presence.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist the Lead in managing the overall operations of the Editing Team',
        'Support the planning and execution of editing and multimedia projects',
        'Supervise team members and ensure smooth workflow and timely task completion',
        'Help organize editing schedules, content management, and project coordination',
        'Maintain coordination with social media, design, and event teams',
        'Ensure consistency in editing quality, branding, and visual presentation',
        'Encourage creativity, collaboration, and skill development within the team',
      ],
      closing: `We believe you will play a crucial role in strengthening the team and enhancing the club's creative output.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    if (role === 'lead') return {
      para1: `We are pleased to inform you that you have been appointed as the Lead of the Editing Team for the academic year 2026–2027 at the Stats-O-Locked Club, VIT Bhopal University. Your selection reflects your creativity, attention to detail, technical expertise, and ability to produce visually engaging and high-quality content.`,
      para2: `As the Editing Team Lead, you will play a vital role in enhancing the club's visual identity and digital presence through impactful editing and creative storytelling. You are expected to demonstrate leadership, innovation, and professionalism while ensuring consistency and excellence in all multimedia content produced by the club.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Lead and manage the editing team for all club-related projects',
        'Edit and produce high-quality videos, reels, promotional content, and multimedia materials',
        'Ensure consistency in visual style, branding, and content quality',
        'Coordinate with the social media, design, and event teams for content requirements',
        'Manage project timelines and ensure timely delivery of edited content',
        'Review and finalize content before publication or presentation',
        'Stay updated with the latest editing trends, tools, and creative techniques',
        'Mentor team members and encourage creativity and collaboration within the team',
      ],
      closing: `We are confident that your leadership will strengthen the club's creative output and contribute significantly to its growth.\n\nCongratulations and best wishes for your journey ahead.`,
    };
    return {
      para1: `We are pleased to appoint you as a Core Member of the Editing Team for the academic year 2026–2027 at the Stats-O-Locked Club of VIT Bhopal University.`,
      para2: `Your creativity, dedication, and enthusiasm for visual storytelling make you a valuable addition to the team, and we look forward to your active contributions toward strengthening the club's creative and digital presence.`,
      para3: '',
      responsibilitiesHeading: 'Roles and Responsibilities:',
      bullets: [
        'Assist in editing and producing high-quality videos, reels, and multimedia content',
        'Support the Lead and Co-Lead in executing editing and multimedia projects',
        'Maintain consistency in visual style, branding, and content quality',
        'Collaborate with the social media, design, and event teams for content requirements',
        'Ensure timely completion and delivery of assigned editing tasks',
        'Stay updated with the latest editing trends, tools, and creative techniques',
        'Contribute creative ideas and support skill development within the team',
      ],
      closing: `We are confident that your contributions will strengthen the team's creative output and help you grow technically and creatively.\n\nCongratulations and best wishes for your journey ahead.`,
    };
  }

  // ── FALLBACK ──────────────────────────────────────────────────────────────
  return {
    para1: `We are pleased to inform you that you have been appointed as the ${position} of the ${team} for the academic year ${acadYear} at the Stats-O-Locked Club, VIT Bhopal University.`,
    para2: `This appointment reflects our confidence in your skills, dedication, and commitment to excellence. You are expected to contribute actively to the team's success and the club's growth.`,
    para3: '',
    responsibilitiesHeading: 'Roles and Responsibilities:',
    bullets: [
      `Lead and execute key initiatives within the ${team}`,
      'Collaborate actively with team leads, faculty coordinators, and core members',
      'Maintain accountability, adherence to deadlines, and high standards of work',
      'Contribute positively to the growth, vision, and technical activities of the club',
    ],
    closing: `We look forward to your valuable contributions.\n\nCongratulations and best wishes for your journey ahead.`,
  };
}

// ── Word-wrap helper, returns final Y ─────────────────────────────────────────
// IMPORTANT: this advances y by `lh` after EVERY line it draws, including the
// last one. (The old version stopped one line short, so callers that only
// added a small 4–10pt gap after calling this were effectively starting the
// next block almost on top of the previous line — that's what caused the
// overlapping bullet text.) Callers should treat their GAP/BGAP/CGAP values
// as *extra* breathing room on top of one full line height, not the entire gap.
function drawWrapped(page, text, x, y, maxW, font, size, lh, color) {
  const words = text.split(' ');
  let line = '';
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (font.widthOfTextAtSize(test, size) > maxW && i > 0) {
      page.drawText(line.trim(), { x, y, size, font, color });
      line = words[i] + ' ';
      y -= lh;
    } else {
      line = test;
    }
  }
  if (line.trim()) {
    page.drawText(line.trim(), { x, y, size, font, color });
    y -= lh;
  }
  return y;
}

// ── Word-wrap helper (dry run): counts lines without drawing ──────────────────
function countWrappedLines(text, maxW, font, size) {
  if (!text) return 0;
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (font.widthOfTextAtSize(test, size) > maxW && i > 0) {
      lines++;
      line = words[i] + ' ';
    } else {
      line = test;
    }
  }
  if (line.trim()) lines++;
  return lines;
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateAppointmentPDF(appointment) {
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([595.27, 841.89]);
  const { width, height } = page.getSize();

  if (fs.existsSync(TEMPLATE_PATH)) {
    const img = await pdfDoc.embedJpg(fs.readFileSync(TEMPLATE_PATH));
    page.drawImage(img, { x: 0, y: 0, width, height });
  } else {
    page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1,1,1) });
  }

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontReg  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const NAVY     = rgb(15/255, 78/255, 132/255);
  const TEXT     = rgb(29/255, 51/255, 71/255);
  const ML = 52, MR = 543, TW = MR - ML;

  const name    = String(appointment.fullName || '');
  const dateStr = formatDate(appointment.appointmentDate);
  const team    = appointment.team || appointment.department || '';
  const pos     = appointment.position || 'Core Member';
  const content = getContent(team, pos, appointment.batch);

  // ── 1. Name & Date — overlay onto template's existing "Dear," and "Date:" labels ──
  // The template already has "Dear," and "Date:" printed on it.
  // We only write the candidate name and the date value.
  const DEAR_Y = 614.5;
  page.drawText(name, { x: 98, y: DEAR_Y, size: 11, font: fontBold, color: NAVY });

  // NOTE: the old code right-aligned the date to MR (543), which for a short
  // margin ends up landing *inside* the printed "Date:" label (label runs to
  // roughly x=499 on this template) — that's the overlap in your screenshot.
  // Fix: place it a fixed distance after the label instead of right-aligning.
  const DATE_X = 506;
  page.drawText(dateStr, { x: DATE_X, y: DEAR_Y, size: 10.5, font: fontBold, color: NAVY });

  // ── 2. Body layout: fit everything above the template's printed footer ────
  // The template image already has "Warm Regards, Stats-O-Locked Club" and the
  // full signature block (with real signatures) baked in, starting at roughly
  // y = 207 on this page. We no longer draw a second copy of either (that
  // duplication was the misaligned "signature box" issue), and we treat that
  // y as a hard floor so long content (e.g. roles with 6-9 bullets) can never
  // run into the printed footer — that collision was the overlapping-text
  // issue in your second screenshot.
  const BODY_TOP     = 590;
  const FOOTER_LIMIT = 215; // small buffer above the template's printed footer
  const AVAILABLE_H  = BODY_TOP - FOOTER_LIMIT;

  // Measure total height a given type-scale would need, without drawing.
  function measure(scale) {
    const fs = 10 * scale, lh = 15 * scale, gap = 10 * scale;
    const bfs = 9.8 * scale, blh = 14 * scale, bgap = 4 * scale;
    const cfs = 9.8 * scale, clh = 14.5 * scale, cgap = 4 * scale;

    let h = countWrappedLines(content.para1, TW, fontReg, fs) * lh;
    if (content.para2) h += gap + countWrappedLines(content.para2, TW, fontReg, fs) * lh;
    if (content.para3) h += gap + countWrappedLines(content.para3, TW, fontReg, fs) * lh;
    h += gap + (4 * scale) + (18 * scale); // heading + spacing before bullets
    for (const b of content.bullets) {
      h += countWrappedLines(`- ${b}`, TW, fontReg, bfs) * blh + bgap;
    }
    h += 8 * scale;
    for (const line of content.closing.split('\n')) {
      if (!line.trim()) { h += 6 * scale; continue; }
      h += countWrappedLines(line, TW, fontReg, cfs) * clh + cgap;
    }
    return h;
  }

  // Use full-size type by default; only shrink (down to 78%) if the content
  // for this particular role would otherwise run past the footer.
  let scale = 1;
  for (let s = 1; s >= 0.78; s -= 0.02) {
    scale = s;
    if (measure(s) <= AVAILABLE_H) break;
  }

  const FS  = 10   * scale, LH  = 15   * scale, GAP  = 10   * scale;
  const BFS = 9.8  * scale, BLH = 14   * scale, BGAP = 4    * scale;
  const CFS = 9.8  * scale, CLH = 14.5 * scale, CGAP = 4    * scale;

  // ── 3. Body paragraphs ────────────────────────────────────────────────────
  let y = BODY_TOP;

  y = drawWrapped(page, content.para1, ML, y, TW, fontReg, FS, LH, TEXT);
  y -= GAP;
  if (content.para2) {
    y = drawWrapped(page, content.para2, ML, y, TW, fontReg, FS, LH, TEXT);
    y -= GAP;
  }
  if (content.para3) {
    y = drawWrapped(page, content.para3, ML, y, TW, fontReg, FS, LH, TEXT);
    y -= GAP;
  }

  // ── 4. Responsibilities heading ───────────────────────────────────────────
  y -= 4 * scale;
  page.drawText(content.responsibilitiesHeading, { x: ML, y, size: 10.5 * scale, font: fontBold, color: NAVY });
  y -= 18 * scale;

  // ── 5. Bullets ────────────────────────────────────────────────────────────
  for (const b of content.bullets) {
    y = drawWrapped(page, `- ${b}`, ML, y, TW, fontReg, BFS, BLH, TEXT);
    y -= BGAP;
  }

  // ── 6. Closing (supports \n for line breaks) ──────────────────────────────
  y -= 8 * scale;
  for (const line of content.closing.split('\n')) {
    if (!line.trim()) { y -= 6 * scale; continue; }
    const isBold = line.startsWith('Congratulations');
    y = drawWrapped(page, line, ML, y, TW, isBold ? fontBold : fontReg, CFS, CLH, TEXT);
    y -= CGAP;
  }

  // "Warm Regards, Stats-O-Locked Club" and the signature block are already
  // printed on the template — nothing further is drawn below this point.

  return await pdfDoc.save();
}
