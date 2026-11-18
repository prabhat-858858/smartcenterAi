
export function calculateCompliance(
  detected,
  requirements
) {
  const checks = [
    {
      name: "chairs",
      actual: detected.chair || 0,
      required: requirements.minChairs || 0
    },
    {
      name: "tables",
      actual: detected.dining_table || 0,
      required: requirements.minTables || 0
    },
    {
      name: "projectors",
      actual: detected.projector || 0,
      required: requirements.minProjectors || 0
    }
  ];

  let achieved = 0;
  let total = checks.length;

  const issues = [];

  checks.forEach(check => {

    if (check.actual >= check.required) {
      achieved++;
    } else {
      issues.push(
        `Insufficient ${check.name}: ${check.actual}/${check.required}`
      );
    }

  });

  const score = total > 0
    ? Math.round((achieved / total) * 100)
    : 100;

  return {
    score,
    issues
  };
}
