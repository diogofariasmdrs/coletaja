import { readTeam, teamVehicle } from "./team.js";
import "../../css/team.css";
export function createTeamCard(parent) {
  const section = document.createElement("section");
  section.className = "vehicle-team";
  section.hidden = true;
  parent.append(section);
  let previous = "";
  return (state, id) => {
    let storage;
    try {
      storage = localStorage;
    } catch {}
    const members =
      teamVehicle(state)?.id === id
        ? readTeam(state, storage).filter((m) => m.name)
        : [];
    const signature = JSON.stringify([id, members]);
    if (signature === previous) return;
    previous = signature;
    section.replaceChildren();
    section.hidden = !members.length;
    if (!members.length) return;
    const title = document.createElement("h3");
    title.textContent = "Equipe responsável";
    const note = document.createElement("small");
    note.textContent = "CJ-01";
    section.append(title, note);
    for (const member of members) {
      const row = document.createElement("div");
      row.className = "team-member";
      const avatar = document.createElement("span");
      avatar.className = "team-avatar";
      avatar.textContent = member.name.charAt(0).toUpperCase();
      avatar.setAttribute("aria-hidden", "true");
      const img = document.createElement("img");
      img.loading = "lazy";
      img.decoding = "async";
      img.width = 48;
      img.height = 48;
      img.alt = "";
      img.src = "/images/equipe/" + member.photo;
      img.onerror = () => img.remove();
      avatar.append(img);
      const text = document.createElement("div"),
        name = document.createElement("strong"),
        role = document.createElement("span");
      name.textContent = member.name;
      role.textContent = member.role;
      text.append(name, role);
      row.append(avatar, text);
      section.append(row);
    }
  };
}
