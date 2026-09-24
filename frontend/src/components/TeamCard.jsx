import { useState } from 'react';
import { INSTITUTION } from '../content/identity';
import { TEAM_DEPARTMENT } from '../content/team';

/** Neutral silhouette shown if a portrait file is missing or fails to load. */
function PortraitFallback() {
  return (
    <svg viewBox="0 0 120 150" className="team-portrait-fallback" aria-hidden="true">
      <rect width="120" height="150" fill="#E9EDF4" />
      <circle cx="60" cy="52" r="24" fill="#C4CCDB" />
      <rect x="17" y="86" width="86" height="80" rx="40" fill="#C4CCDB" />
    </svg>
  );
}

/** One team member: portrait, name, department and institution. */
export default function TeamCard({ member }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="team-card">
      <div className="team-portrait">
        {failed ? (
          <PortraitFallback />
        ) : (
          <img
            src={member.photo}
            alt={`Photo of ${member.name}`}
            width="600"
            height="750"
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <div className="team-info">
        <h3 className="team-name">{member.name}</h3>
        <dl className="team-facts">
          <div>
            <dt>Department</dt>
            <dd>{TEAM_DEPARTMENT}</dd>
          </div>
          <div>
            <dt>Institution</dt>
            <dd>{INSTITUTION.name}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
