
export const aboutQuery = `
  *[_type == "aboutPage" && _id == "aboutPage"][0] {
    _id,

    name,
    headline,
    introduction,

    "experience": coalesce(
      experience[]{
        _key,
        role,
        organization,
        startYear,
        endYear,
        isCurrent,
        description
      },
      []
    ),

    "education": coalesce(
      education[]{
        _key,
        degree,
        institution,
        startYear,
        endYear,
        description
      },
      []
    ),

    "skillGroups": coalesce(
      skillGroups[]{
        _key,
        title,
        "skills": coalesce(skills, [])
      },
      []
    ),

    "languages": coalesce(
      languages[]{
        _key,
        name,
        proficiency
      },
      []
    ),

    "achievements": coalesce(
      achievements[]{
        _key,
        title,
        year,
        description
      },
      []
    ),

    email,
    githubUrl,
    linkedinUrl,
    itchUrl,

    cvPt{
      asset->{
        _id,
        url
      }
    },

    cvEn{
      asset->{
        _id,
        url
      }
    }
  }
`;
