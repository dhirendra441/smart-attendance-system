import { useState } from "react";

const initialFormState = {
  courseName: "",
  section: "",
  room: "",
  validityMinutes: 2
};

export const CreateSessionForm = ({ onSubmit, isSubmitting }) => {
  const [formState, setFormState] = useState(initialFormState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const wasSuccessful = await onSubmit({
      ...formState,
      validityMinutes: Number(formState.validityMinutes)
    });

    if (wasSuccessful) {
      setFormState(initialFormState);
    }
  };

  return (
    <section className="modern-panel" style={{ height: '100%' }}>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Teacher Action</p>
          <h2>Create Attendance Session</h2>
        </div>
        <span className="status-badge neutral">QR valid 1-30m</span>
      </div>

      <form className="session-form" onSubmit={handleSubmit}>
        <label>
          Course Name
          <input name="courseName" value={formState.courseName} onChange={handleChange} placeholder="e.g., Deep Learning" required />
        </label>

        <label>
          Section
          <input name="section" value={formState.section} onChange={handleChange} placeholder="e.g., CSE-A" />
        </label>

        <label>
          Room
          <input name="room" value={formState.room} onChange={handleChange} placeholder="e.g., LAB-204" />
        </label>

        <label>
          Validity (minutes)
          <input name="validityMinutes" value={formState.validityMinutes} onChange={handleChange} type="number" min="1" max="30" required />
        </label>

        <button type="submit" className="primary-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Generate QR Session"}
        </button>
      </form>
    </section>
  );
};