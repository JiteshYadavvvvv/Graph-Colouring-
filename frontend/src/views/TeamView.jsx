import { motion } from 'framer-motion';
import SiteFooter from '../components/SiteFooter';
import TeamCard from '../components/TeamCard';
import { INSTITUTION, PROJECT } from '../content/identity';
import { TEAM } from '../content/team';

export default function TeamView({ navigate }) {
  return (
    <>
      <div className="page">
        <section className="team-section" aria-labelledby="team-title">
          <header className="page-header team-header">
            <div>
              <span className="eyebrow">About · {PROJECT.name}</span>
              <h1 id="team-title">Project Team</h1>
              <p className="muted">{INSTITUTION.department}</p>
            </div>
          </header>
          <div className="team-grid">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
              >
                <TeamCard member={member} />
              </motion.div>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter onNavigate={navigate} current="team" />
    </>
  );
}
