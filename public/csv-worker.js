// Web Worker for asynchronous CSV parsing off the main UI thread
self.onmessage = function (e) {
  const fileText = e.data;
  if (!fileText) {
    self.postMessage({ error: "No CSV text provided" });
    return;
  }

  try {
    const lines = fileText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      self.postMessage({ error: "CSV file is empty" });
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (!currentLine.trim()) continue;

      // Simple regex CSV line parser
      const values = currentLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || currentLine.split(",");
      const recordObj = {};

      headers.forEach((header, idx) => {
        let val = values && values[idx] ? values[idx].trim() : "";
        val = val.replace(/^"|"$/g, "");
        recordObj[header] = val;
      });

      records.push(recordObj);

      // Post progress every 500 rows
      if (records.length % 500 === 0) {
        self.postMessage({ progress: Math.round((i / lines.length) * 100), count: records.length });
      }
    }

    self.postMessage({ success: true, records, total: records.length });
  } catch (err) {
    self.postMessage({ error: err.message || "Failed to parse CSV file in background" });
  }
};
