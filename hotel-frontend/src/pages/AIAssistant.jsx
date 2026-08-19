import { useState } from "react";
import { analyzeComplaint } from "../data/aiAnalyzer";

const AIAssistant = () => {
  const [complaintText, setComplaintText] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!complaintText.trim()) return;

    setAnalyzing(true);
    setResult(null);

    // Simulate AI "thinking" delay — later replaced by a real backend/AI API call
    setTimeout(() => {
      const aiResult = analyzeComplaint(complaintText);
      setResult(aiResult);
      setAnalyzing(false);
    }, 800);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1E3A8A] mb-6">🤖 AI Assistant</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Complaint Analysis */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-[#1E3A8A] mb-4">AI Complaint Analysis</h2>

          <label className="block text-sm font-medium mb-2">Complaint</label>
          <textarea
            value={complaintText}
            onChange={(e) => setComplaintText(e.target.value)}
            rows={5}
            placeholder="Paste or type a customer complaint here..."
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full bg-[#1E3A8A] text-white py-2 rounded font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>

          {result && (
            <div className="mt-6 pt-4 border-t space-y-2 text-sm">
              <p><strong>Category:</strong> {result.category}</p>
              <p><strong>Priority:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.priority === "High"
                      ? "bg-red-100 text-red-700"
                      : result.priority === "Medium"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {result.priority}
                </span>
              </p>
              <p><strong>Suggested Department:</strong> {result.department}</p>
            </div>
          )}
        </div>

        {/* Card 2: How it works / info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-[#1E3A8A] mb-4">How the AI Assistant Helps</h2>
          <ul className="space-y-3 text-sm text-gray-600">
            <li>✅ Automatically categorizes incoming complaints (Room, Cleaning, Staff, Billing)</li>
            <li>✅ Flags urgency level so high-priority issues get handled first</li>
            <li>✅ Suggests which department should resolve the issue</li>
            <li>✅ Saves staff time on manually reading and routing every complaint</li>
          </ul>
          <p className="text-xs text-gray-400 mt-6">
            Note: this is currently a rule-based simulation for the frontend demo.
            Once connected to the backend, this will call a real AI model (e.g. via OpenAI or Claude API)
            for more accurate analysis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;