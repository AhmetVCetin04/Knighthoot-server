async function handleDeleteAccount(req, res, Teachers, Students) {
    try {
        const { id, role } = req.user; // from JWT payload

        // Pick the correct collection
        const collection = role === "teacher" ? Teachers : Students;

        // Convert JWT id to number just in case DB stores as number
        const numericId = typeof id === "string" ? parseInt(id) : id;

        const result = await collection.deleteOne({ ID: numericId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: `${role} not found or already deleted` });
        }

        return res.status(200).json({ message: `${role} account deleted successfully` });
        
    } catch (err) {
        console.error("Delete Account Error:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = handleDeleteAccount;
