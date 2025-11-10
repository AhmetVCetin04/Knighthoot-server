// api/getParticipants.js
// GET /api/test/participants?pin=ABCD
module.exports = async function handleGetParticipants(req, res, Tests, Scores, Students) {
  const { pin } = req.query;
  if (!pin) return res.status(400).json({ error: "Missing 'pin' query param." });

  try {
    const test = await Tests.findOne({ PIN: pin });
    if (!test) return res.status(404).json({ error: "Test not found for this PIN." });

    // all joined students have a Scores doc for this test (created by /api/joinTest)
    const scores = await Scores.find({ testID: test.ID }).project({ SID: 1 }).toArray();
    const sids = [...new Set(scores.map(s => s.SID))];

    if (sids.length === 0) return res.json({ testID: test.ID, pin, count: 0, participants: [] });

    const students = await Students.find({ ID: { $in: sids } })
      .project({ ID: 1, name: 1 })
      .toArray();

    const nameById = new Map(students.map(s => [s.ID, s.name || `Student ${s.ID}`]));
    const participants = sids.map(SID => ({ SID, name: nameById.get(SID) || `Student ${SID}` }));

    res.json({ testID: test.ID, pin, count: participants.length, participants });
  } catch (e) {
    console.error("getParticipants error:", e);
    res.status(500).json({ error: "Internal error retrieving participants." });
  }
};
