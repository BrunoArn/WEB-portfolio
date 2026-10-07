const en = {
  navigation: {
    home: "Home",
    projects: "Projects",
    about: "About",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
  },
  home: {
    hero: {
      eyebrow: "DESIGNER / DEVELOPER · GAME DEVELOPER",
      title: "Creating games and digital experiences.",
      description:
        "Game development, VR experiences and web applications, combining technical execution with design sensibility.",
      cta: "EXPLORE PROJECTS",
    },
    featured: {
      eyebrow: "SELECTED WORK",
      title: "Featured Projects",
      viewAll: "VIEW ALL",
      selectProject: "Select project",
    },
    moreProjects: {
      title: "More Projects",
    },
  },
  projects: {
    title: "Projects",
    description:
      "Projects across games, web, VR and interactive experiences, bringing together professional, personal and experimental work.",

    filters: {
      all: "All",
      label: "Filter projects",
      empty: "No projects found in this category.",
    },
  },
  projectDetail: {
    about: "About the Project",

    actions: {
      github: "GITHUB",
      liveSite: "LIVE SITE",
    },

    info: {
      title: "Project Info",
      role: "Role",
      year: "Year",
      team: "Team",
      technologies: "Technologies",
      organization: "Organization",
      status: "Status",

      statuses: {
        released: "Released",
        prototype: "Prototype",
        hackathon: "Hackathon",
        client: "Client",
        development: "In Development",
        archived: "Archived",
      },
    },
    media: {
      select: "Select media",
    },
    gallery: {
      title: "Gallery",
    },
    playable: {
      title: "Play Project",
      frameTitle: "Interactive game",
    },
  },
} as const;

export default en;