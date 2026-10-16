export const propostasRedacao = [
  {
    tema: "Os desafios da inteligência artificial na formação dos jovens brasileiros",
    apoio:
      "Pesquisas mostram que a maioria dos estudantes já usa ferramentas de IA para tarefas escolares, enquanto poucas escolas têm regras claras sobre o uso.",
  },
  {
    tema: "Caminhos para enfrentar os impactos das mudanças climáticas nas cidades brasileiras",
    apoio:
      "Enchentes, ondas de calor e deslizamentos se tornaram mais frequentes, atingindo principalmente as populações das periferias.",
  },
  {
    tema: "Desinformação e o risco à democracia na era das redes sociais",
    apoio:
      "Notícias falsas se espalham mais rápido que as verdadeiras e influenciam decisões sobre saúde, eleições e direitos.",
  },
  {
    tema: "Apostas online e o endividamento das famílias brasileiras",
    apoio:
      "Milhões de brasileiros apostam em sites de jogos, e parte do dinheiro de programas sociais tem sido gasto nessas plataformas.",
  },
  {
    tema: "Saúde mental de adolescentes em tempos de hiperconexão",
    apoio:
      "Casos de ansiedade e depressão entre jovens cresceram junto com o tempo de tela diário.",
  },
  {
    tema: "Desafios para a segurança alimentar em um país produtor de alimentos",
    apoio:
      "O Brasil está entre os maiores produtores de alimentos do mundo, mas milhões de pessoas ainda convivem com a fome.",
  },
];

export type Questao = {
  materia: string;
  enunciado: string;
  alternativas: string[];
  correta: number;
  explicacao: string;
};

export const questoes: Questao[] = [
  {
    materia: "Matemática",
    enunciado:
      "Um produto de R$ 200 teve aumento de 10% e depois desconto de 10%. Qual o preço final?",
    alternativas: ["R$ 200", "R$ 198", "R$ 202", "R$ 180", "R$ 220"],
    correta: 1,
    explicacao: "200 × 1,1 = 220; 220 × 0,9 = 198.",
  },
  {
    materia: "Matemática",
    enunciado: "As notas de um aluno foram 6, 8, 8, 7 e 9. Qual é a mediana?",
    alternativas: ["7", "7,6", "8", "8,5", "9"],
    correta: 2,
    explicacao: "Em ordem: 6, 7, 8, 8, 9. O valor do meio é 8.",
  },
  {
    materia: "Matemática",
    enunciado: "Num mapa de escala 1:50.000, 4 cm correspondem a quantos km reais?",
    alternativas: ["0,2 km", "2 km", "20 km", "200 km", "0,02 km"],
    correta: 1,
    explicacao: "4 × 50.000 = 200.000 cm = 2 km.",
  },
  {
    materia: "Matemática",
    enunciado: "Ao lançar dois dados comuns, qual a probabilidade de a soma ser 7?",
    alternativas: ["1/12", "1/9", "1/6", "1/4", "7/36"],
    correta: 2,
    explicacao: "Há 6 combinações favoráveis entre 36 possíveis: 6/36 = 1/6.",
  },
  {
    materia: "Linguagens",
    enunciado: 'Na frase "Tô indo pro trampo", o uso da linguagem é um exemplo de:',
    alternativas: [
      "Erro gramatical sem valor",
      "Variação linguística informal",
      "Linguagem técnica",
      "Norma padrão",
      "Arcaísmo",
    ],
    correta: 1,
    explicacao: "É uma variedade informal, legítima em contextos de fala do dia a dia.",
  },
  {
    materia: "Linguagens",
    enunciado:
      "Um texto publicitário que busca convencer o leitor a comprar um produto tem como função predominante a:",
    alternativas: ["Referencial", "Poética", "Conativa (apelativa)", "Fática", "Metalinguística"],
    correta: 2,
    explicacao: "A função conativa tem foco no receptor, tentando influenciá-lo.",
  },
  {
    materia: "Linguagens",
    enunciado: "A Semana de Arte Moderna de 1922 buscava principalmente:",
    alternativas: [
      "Imitar a arte europeia clássica",
      "Romper com padrões acadêmicos e valorizar a cultura brasileira",
      "Retomar o Parnasianismo",
      "Defender a monarquia",
      "Proibir a arte popular",
    ],
    correta: 1,
    explicacao: "Os modernistas queriam liberdade de criação e uma arte com identidade nacional.",
  },
  {
    materia: "Ciências Humanas",
    enunciado: "A Era Vargas ficou marcada, entre outros pontos, pela:",
    alternativas: [
      "Abolição da escravidão",
      "Criação da CLT",
      "Proclamação da República",
      "Independência do Brasil",
      "Criação do Plano Real",
    ],
    correta: 1,
    explicacao: "A Consolidação das Leis do Trabalho foi criada em 1943, no governo Vargas.",
  },
  {
    materia: "Ciências Humanas",
    enunciado: "Para os contratualistas, como Hobbes, o Estado surge para:",
    alternativas: [
      "Garantir a paz e evitar a guerra de todos contra todos",
      "Abolir as leis",
      "Servir apenas à Igreja",
      "Eliminar a propriedade",
      "Impedir o comércio",
    ],
    correta: 0,
    explicacao:
      "Hobbes via o Estado (Leviatã) como garantia de segurança diante do estado de natureza.",
  },
  {
    materia: "Ciências Humanas",
    enunciado: "As ilhas de calor urbanas são causadas principalmente por:",
    alternativas: [
      "Excesso de áreas verdes",
      "Concentração de asfalto, concreto e pouca vegetação",
      "Proximidade do mar",
      "Chuvas intensas",
      "Baixa população",
    ],
    correta: 1,
    explicacao: "Materiais urbanos absorvem calor e a falta de vegetação reduz o resfriamento.",
  },
  {
    materia: "Ciências da Natureza",
    enunciado:
      "O principal gás associado ao aumento do efeito estufa pela queima de combustíveis fósseis é o:",
    alternativas: [
      "Oxigênio (O₂)",
      "Nitrogênio (N₂)",
      "Dióxido de carbono (CO₂)",
      "Hélio (He)",
      "Hidrogênio (H₂)",
    ],
    correta: 2,
    explicacao: "A queima de combustíveis fósseis libera grandes quantidades de CO₂.",
  },
  {
    materia: "Ciências da Natureza",
    enunciado: "Um chuveiro de 5.000 W ligado por 30 minutos consome quanta energia?",
    alternativas: ["2,5 kWh", "5 kWh", "150 kWh", "0,5 kWh", "25 kWh"],
    correta: 0,
    explicacao: "E = P × t = 5 kW × 0,5 h = 2,5 kWh.",
  },
  {
    materia: "Ciências da Natureza",
    enunciado: "Do cruzamento Aa × Aa, qual a proporção esperada de descendentes aa?",
    alternativas: ["0%", "25%", "50%", "75%", "100%"],
    correta: 1,
    explicacao: "Os resultados são AA, Aa, Aa, aa — 1 em 4, ou seja, 25%.",
  },
];
