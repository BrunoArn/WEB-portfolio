const site = {
  name: "Bruno Arnaud",
  description: "Designer / Desenvolvedor — Desenvolvedor de jogos",
} as const;

const pt = {
  site,
  metadata: {
    home: {
      title: site.name + " | Desenvolvimento de jogos, Unity e VR/XR",
      description: "Portfólio de Bruno Arnaud: desenvolvimento de jogos em Unity e C#, experiências VR/XR e projetos interativos.",
    },
  },
  navigation: {
    menu: "MENU",
    close: "FECHAR",
    home: "Início",
    projects: "Projetos",
    about: "Sobre",
    openMenu: "Abrir menu de navegação",
    closeMenu: "Fechar menu de navegação",
  },
  atlas: {
    title: site.name,
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
      loading: "Carregando mídia…",
      error: "Não foi possível carregar esta mídia.",
      retry: "Tentar novamente",
    },
    playable: {
      title: "Jogar projeto",
      frameTitle: "Jogo interativo",
      start: "Jogar",
      close: "Fechar jogo",
      desktopTitle: "Jogue no computador",
      desktopDescription: "Esta experiência foi desenvolvida para desktop. Abra este projeto em um computador para jogar.",
      copyLink: "Copiar link do projeto",
      linkCopied: "Link copiado",
      copyFailed: "Não foi possível copiar automaticamente. Copie o link abaixo.",
      projectLink: "Link do projeto",
    },
    related: {
      title: "Você também pode gostar",
    },
  },
} as const;

export default pt;