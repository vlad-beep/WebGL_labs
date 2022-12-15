let funcV =
(a * b) /
Math.sqrt(
  a * a * Math.sin(deg2rad(i)) * Math.sin(deg2rad(i)) +
    b * b * Math.cos(deg2rad(i)) * Math.cos(deg2rad(i)),
);
vertexList.push(
0.5 *
  Math.cos(deg2rad(i)) *
  Math.abs(
    funcV * (1 + Math.cos(deg2rad(i))) +
      (Math.pow(d,2) - Math.pow(c,2)) * ((1 - Math.cos(deg2rad(i))) / funcV),
  ),
0.5 *
  Math.sin(deg2rad(i)) *
  Math.abs(
    funcV * (1 + Math.cos(deg2rad(i))) +
      (Math.pow(d,2) - Math.pow(c,2)) * ((1 - Math.cos(deg2rad(i))) / funcV),
  ),
0.5 * Math.sin(deg2rad(i)) * Math.abs(funcV - (Math.pow(d,2) - Math.pow(c,2) / funcV)),