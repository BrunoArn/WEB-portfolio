const pt = {
  navigation: {
    home: "Início",
    projects: "Projetos",
    about: "Sobre",
    openMenu: "Abrir menu de navegação",
    closeMenu: "Fechar menu de navegação",
  },
  home: {
    hero: {
      eyebrow: "DESIGNER / DEVELOPER · GAME DEVELOPER",
      title: "Criando jogos e experiências digitais.",
      description:
        "Desenvolvimento de jogos, experiências VR e aplicações web, unindo execução técnica e sensibilidade de design.",
      cta: "EXPLORAR PROJETOS",
    },
    featured: {
      eyebrow: "TRABALHOS SELECIONADOS",
      title: "Projetos em destaque",
      viewAll: "VER TODOS",
      selectProject: "Selecionar projeto",
    },
    moreProjects: {
      title: "Mais projetos",
    },
  },
  projects: {
    title: "Projetos",
    description:
      "Projetos em games, web, VR e experiências interativas, reunindo trabalhos profissionais, pessoais e experimentais.",

    filters: {
      all: "Todos",
      label: "Filtrar projetos",
      empty: "Nenhum projeto encontrado nesta categoria.",
    },
  },
  projectDetail: {
    about: "Sobre o projeto",

    actions: {
      github: "GITHUB",
      liveSite: "VER SITE",
    },

    info: {
      title: "Informações do projeto",
      role: "Função",
      year: "Ano",
      team: "Equipe",
      technologies: "Tecnologias",
      organization: "Organização",
      status: "Status",

      statuses: {
        released: "Lançado",
        prototype: "Protótipo",
        hackathon: "Hackathon",
        client: "Cliente",
        development: "Em desenvolvimento",
        archived: "Arquivado",
      },
    },
  },
} as const;

export default pt;