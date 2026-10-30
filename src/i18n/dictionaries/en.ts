const en = {
  navigation: {
    home: "Home",
    projects: "Projects",
    about: "About",
    openMenu: "Open navigation menu",
    closeMenu: "Close navigation menu",
  },
  atlas: {
    title: "Bruno Arnaud",
    description: "A landscape of games, interfaces and interactive experiences.",
    projects: "Atlas projects",
    unavailable: "Thumbnail unavailable",
    close: "Back to map",
    contentNote: "Description unavailable.",
    detail: "View full project",
    previewTitle: "Atlas — Preview",
    fallback: "Simplified view enabled.",
    motion: {
      title: "Motion · experiment",
      description: "Move between the contours or open a project. Turn off to compare. Local, unsaved adjustments.",
      enabled: "Living landscape",
      reduced: "Your device requests reduced motion: the landscape stays still.",
      reset: "Reset experiment",
      controls: {
        breath: "Breathing",
        pressure: "Line response",
        returnTime: "Return time",
        mouseRadius: "Pointer reach",
        selectionStrength: "Selection impulse",
      },
    },
    terrain: {
      title: "Adjust terrain",
      mobile: "mobile",
      desktop: "desktop",
      description: "Local preview: does not save to Sanity. Publish through Atlas — Topografia in Studio.",
      reset: "Restore reference",
      controls: {
        amplitude: "Spread",
        elongation: "Elongation",
        direction: "Direction",
        connection: "Connection",
        negativeSpace: "Open space",
      },
    },
    content: {
      unavailable: "unavailable",
      territoryIncomplete: "incomplete territory settings",
      titleUnavailable: "Title unavailable",
      destinationUnavailable: "destination unavailable",
      placementInvalid: "check main territory, positions and influence",
      imageUnavailable: "cover or alt text unavailable",
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

  about: {
    emailLabel: "SEND EMAIL",
    cvLabel: "VIEW RÉSUMÉ",
    experience: "Professional Experience",
    present: "Present",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    links: "Professional Links",
    achievements: "Achievements & Highlights",
  },

  projectDetail: {
    about: "About the Project",

    actions: {
      play: "PLAY",
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
      title: "Project Media",
      select: "Select media",
      expand: "Expand media",
      close: "Close",
      previous: "Previous media",
      next: "Next media",
    },
    playable: {
      title: "Play Project",
      frameTitle: "Interactive game",
      start: "Play",
      close: "Close game",
    },
    related: {
      title: "You May Also Like",
    },
  },
} as const;

export default en;