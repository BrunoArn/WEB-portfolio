const pt = {
  navigation: {
    home: "Início",
    projects: "Projetos",
    about: "Sobre",
    openMenu: "Abrir menu de navegação",
    closeMenu: "Fechar menu de navegação",
  },
  atlas: {
    title: "Bruno Arnaud",
    description: "Um território de jogos, interfaces e experiências interativas.",
    projects: "Projetos do Atlas",
    unavailable: "Miniatura indisponível",
    close: "Voltar ao mapa",
    contentNote: "Descrição indisponível.",
    detail: "Ver projeto completo",
    previewTitle: "Atlas — Prévia",
    fallback: "Visualização simplificada ativada.",
    motion: {
      title: "Movimento · experimento",
      description: "Passe o mouse entre as curvas ou abra um projeto. Desligue para comparar. Ajustes locais, sem salvar.",
      enabled: "Cenário vivo",
      reduced: "Seu dispositivo pede movimento reduzido: o cenário permanece estático.",
      reset: "Restaurar experimento",
      controls: {
        breath: "Respiração",
        pressure: "Resposta das linhas",
        returnTime: "Tempo de retorno",
        mouseRadius: "Alcance do mouse",
        selectionStrength: "Impulso da seleção",
      },
    },
    terrain: {
      title: "Ajustar relevo",
      mobile: "celular",
      desktop: "desktop",
      description: "Teste local: não salva no Sanity. Para publicar, use Atlas — Topografia no Studio.",
      reset: "Restaurar referência",
      controls: {
        amplitude: "Amplitude",
        elongation: "Alongamento",
        direction: "Direção",
        connection: "Conexão",
        negativeSpace: "Respiro",
      },
    },
    content: {
      unavailable: "indisponível",
      territoryIncomplete: "configuração de território incompleta",
      titleUnavailable: "Título indisponível",
      destinationUnavailable: "destino indisponível",
      placementInvalid: "confira território principal, posições e influência",
      imageUnavailable: "capa ou texto alternativo indisponível",
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

  about: {
    emailLabel: "ENVIAR E-MAIL",
    cvLabel: "VER CURRÍCULO",
    experience: "Experiência profissional",
    present: "Presente",
    education: "Formação acadêmica",
    skills: "Competências",
    languages: "Idiomas",
    links: "Links profissionais",
    achievements: "Conquistas e destaques",
  },

  projectDetail: {
    about: "Sobre o projeto",

    actions: {
      play: "JOGAR",
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
    media: {
      title: "Mídia do projeto",
      select: "Selecionar mídia",
      expand: "Ampliar mídia",
      close: "Fechar",
      previous: "Mídia anterior",
      next: "Próxima mídia",
    },
    playable: {
      title: "Jogar projeto",
      frameTitle: "Jogo interativo",
      start: "Jogar",
      close: "Fechar jogo",
    },
    related: {
      title: "Você também pode gostar",
    },
  },
} as const;

export default pt;