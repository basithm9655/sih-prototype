// --- MOCK DATA ---
const internships = [
    { id: 1, title: 'Data Analytics Intern', company: 'DataCorp', company_logo: 'https://placehold.co/64x64/0ea5e9/ffffff?text=D', location: 'Mumbai', location_type: 'Urban', required_skills: ['Excel', 'SQL', 'Communication'], interest_tags: ['Technology', 'Data'], min_readiness: 40 },
    { id: 2, title: 'Social Media Marketing Intern', company: 'Connectify', company_logo: 'https://placehold.co/64x64/ec4899/ffffff?text=C', location: 'Remote', location_type: 'Rural', required_skills: ['Marketing', 'Communication'], interest_tags: ['Marketing', 'Startups'], min_readiness: 20 },
    { id: 3, title: 'UI/UX Design Intern', company: 'PixelPerfect', company_logo: 'https://placehold.co/64x64/8b5cf6/ffffff?text=P', location: 'Bangalore', location_type: 'Urban', required_skills: ['Figma', 'Teamwork'], interest_tags: ['Design', 'Technology'], min_readiness: 30 },
    { id: 4, title: 'Jr. Python Developer', company: 'CodeGenius', company_logo: 'https://placehold.co/64x64/f59e0b/ffffff?text=CG', location: 'Pune', location_type: 'Urban', required_skills: ['Python', 'SQL', 'Teamwork'], interest_tags: ['Software', 'Technology'], min_readiness: 65 },
    { id: 5, title: 'Content Writer (Tech)', company: 'WordWeavers', company_logo: 'https://placehold.co/64x64/10b981/ffffff?text=W', location: 'Remote', location_type: 'Rural', required_skills: ['Communication'], interest_tags: ['Marketing', 'Technology'], min_readiness: 15 },
    { id: 6, title: 'Business Analyst Intern', company: 'StratLink', company_logo: 'https://placehold.co/64x64/6366f1/ffffff?text=S', location: 'Gurgaon', location_type: 'Urban', required_skills: ['Excel', 'Communication', 'Marketing'], interest_tags: ['Business', 'Startups'], min_readiness: 50 },
];


// --- AI ALLOCATION ENGINE ---
function calculateMatch(student, internship) {
    let skill_match = 0;
    const required = internship.required_skills;
    const studentSkills = student.skills;
    const commonSkills = required.filter(skill => studentSkills.includes(skill));
    skill_match = (commonSkills.length / required.length) * 100;

    let interest_match = 0;
    const commonInterests = internship.interest_tags.filter(tag => student.interests.includes(tag));
    interest_match = commonInterests.length > 0 ? 100 : 0; // Simplified for demo

    let readiness = 0;
    if (student.readiness_score >= internship.min_readiness) {
        readiness = 100;
    } else {
        readiness = (student.readiness_score / internship.min_readiness) * 80; // Penalize but don't disqualify
    }
    
    // Weighted match score
    const total_score = (skill_match * 0.5) + (interest_match * 0.2) + (readiness * 0.3);

    return {
        ...internship,
        match_score: total_score,
        reason_vector: {
            skill_match: skill_match,
            interest_match: interest_match,
            readiness: readiness,
        }
    };
}


// --- SERVERLESS FUNCTION HANDLER ---
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const studentProfile = JSON.parse(event.body);

        if (!studentProfile || !studentProfile.readiness_score) {
            return { statusCode: 400, body: 'Invalid student profile provided.' };
        }
        
        const matchedInternships = internships
            .map(internship => calculateMatch(studentProfile, internship))
            .filter(internship => internship.match_score > 30) // Only show relevant matches
            .sort((a, b) => b.match_score - a.match_score);

        // Fairness Check
        const fairness_ratio = {
            urban: matchedInternships.filter(i => i.location_type === 'Urban').length,
            rural: matchedInternships.filter(i => i.location_type === 'Rural').length
        };

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matched_internships: matchedInternships,
                fairness_ratio: fairness_ratio
            }),
        };

    } catch (error) {
        console.error('Error in gemini function:', error);
        return { statusCode: 500, body: 'Internal Server Error' };
    }
};
