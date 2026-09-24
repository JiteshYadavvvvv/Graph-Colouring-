/**
 * Small real-world graphs that can be opened in the Graph Playground from the
 * Applications page. Only the vertices and edges are given; everything else
 * (colors, χ, statistics) is computed by the backend when the graph is run.
 */
export const EXAMPLES = {
  exams: {
    title: 'Exam timetable',
    hint: 'Vertex = exam, edge = the two exams share a student, color = time slot.',
    vertices: [
      { name: 'Maths', x: 320, y: 70 },
      { name: 'Physics', x: 500, y: 150 },
      { name: 'Chemistry', x: 470, y: 320 },
      { name: 'Biology', x: 300, y: 370 },
      { name: 'English', x: 130, y: 300 },
      { name: 'History', x: 130, y: 130 },
      { name: 'Computer Sci', x: 330, y: 215 },
    ],
    edges: [
      ['Maths', 'Physics'],
      ['Maths', 'Chemistry'],
      ['Maths', 'Computer Sci'],
      ['Maths', 'History'],
      ['Physics', 'Chemistry'],
      ['Physics', 'Computer Sci'],
      ['Chemistry', 'Biology'],
      ['Biology', 'English'],
      ['English', 'History'],
    ],
  },
  channels: {
    title: 'Wireless channel allocation',
    hint: 'Vertex = transmitter, edge = the two are close enough to interfere, color = frequency channel.',
    vertices: [
      { name: 'Tower Hub', x: 320, y: 210 },
      { name: 'North', x: 320, y: 60 },
      { name: 'North East', x: 450, y: 135 },
      { name: 'South East', x: 450, y: 285 },
      { name: 'South', x: 320, y: 360 },
      { name: 'South West', x: 190, y: 285 },
      { name: 'North West', x: 190, y: 135 },
    ],
    edges: [
      ['Tower Hub', 'North'],
      ['Tower Hub', 'North East'],
      ['Tower Hub', 'South East'],
      ['Tower Hub', 'South'],
      ['Tower Hub', 'South West'],
      ['Tower Hub', 'North West'],
      ['North', 'North East'],
      ['North East', 'South East'],
      ['South East', 'South'],
      ['South', 'South West'],
      ['South West', 'North West'],
      ['North West', 'North'],
    ],
  },
  registers: {
    title: 'Register allocation',
    hint: 'Vertex = program variable, edge = both are live at the same time, color = CPU register.',
    vertices: [
      { name: 'a', x: 150, y: 90 },
      { name: 'b', x: 330, y: 70 },
      { name: 'c', x: 500, y: 130 },
      { name: 'd', x: 470, y: 320 },
      { name: 'e', x: 290, y: 360 },
      { name: 'f', x: 130, y: 270 },
    ],
    edges: [
      ['a', 'b'],
      ['a', 'f'],
      ['b', 'c'],
      ['b', 'e'],
      ['b', 'f'],
      ['c', 'd'],
      ['c', 'e'],
      ['d', 'e'],
      ['e', 'f'],
    ],
  },
};
