function Profile() {
  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div className="profile-avatar" aria-label="Profile initials JD">
          <span>JD</span>
          <i />
        </div>
        <div className="eyebrow justify-center">STUDENT PROFILE</div>
        <h1>Jordan Davis</h1>
        <p>they / them</p>
      </div>

      <div className="profile-info-grid">
        <div className="profile-info-item">
          <span className="profile-info-label">SCHOOL</span>
          <strong>Northwood University</strong>
          <small>Undergraduate · Year 2</small>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">EMAIL</span>
          <strong>jordan.davis@northwood.edu</strong>
          <small>Primary student email</small>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">SEMESTER START</span>
          <strong>September 3, 2026</strong>
          <small>Fall semester</small>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">SEMESTER END</span>
          <strong>December 18, 2026</strong>
          <small>Fall semester</small>
        </div>
        <div className="profile-info-item">
          <span className="profile-info-label">TIME ZONE</span>
          <strong>Eastern Time (ET)</strong>
          <small>America / New York</small>
        </div>
      </div>
    </section>
  );
}

export default Profile;
