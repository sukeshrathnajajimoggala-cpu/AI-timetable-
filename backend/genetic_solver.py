import random
import copy
from typing import List, Dict, Tuple
from models import Course, Professor, Room, Timeslot, ScheduleSession, Conflict

def evaluate_schedule(
    schedule: List[ScheduleSession], 
    courses: List[Course], 
    professors: List[Professor], 
    rooms: List[Room], 
    timeslots: List[Timeslot]
) -> Tuple[float, List[Conflict], int, int]:
    
    course_map = {c.id: c for c in courses}
    prof_map = {p.id: p for p in professors}
    room_map = {r.id: r for r in rooms}
    slot_map = {t.id: t for t in timeslots}

    conflicts = []
    hard_count = 0
    soft_count = 0
    penalties = 0.0

    room_slot_allocations = {}
    prof_slot_allocations = {}
    course_days = {}

    for session in schedule:
        course = course_map.get(session.course_id)
        if not course:
            continue
        
        prof_id = course.professor_id
        room_id = session.room_id
        slot_id = session.timeslot_id
        slot = slot_map.get(slot_id)
        
        # 1. Room Clash collection
        key_room_slot = (room_id, slot_id)
        if key_room_slot not in room_slot_allocations:
            room_slot_allocations[key_room_slot] = []
        room_slot_allocations[key_room_slot].append(session.session_id)

        # 2. Professor Clash collection
        key_prof_slot = (prof_id, slot_id)
        if key_prof_slot not in prof_slot_allocations:
            prof_slot_allocations[key_prof_slot] = []
        prof_slot_allocations[key_prof_slot].append(session.session_id)

        # 3. Room Capacity Check
        room = room_map.get(room_id)
        if room and course.enrollment > room.capacity:
            conflicts.append(Conflict(
                type="capacity_overflow",
                description=f"Capacity Overflow: '{course.name}' (size {course.enrollment}) scheduled in Room '{room.name}' (capacity {room.capacity}).",
                session_ids=[session.session_id],
                severity="hard"
            ))
            hard_count += 1
            penalties += 5.0

        # 4. Room Type Check
        if course.requires_lab and room and not room.is_lab:
            conflicts.append(Conflict(
                type="room_type_mismatch",
                description=f"Room Type Mismatch: '{course.name}' requires a Lab, but is scheduled in Lecture Room '{room.name}'.",
                session_ids=[session.session_id],
                severity="hard"
            ))
            hard_count += 1
            penalties += 8.0

        # Spacing Collection
        if slot:
            if course.id not in course_days:
                course_days[course.id] = []
            course_days[course.id].append(slot.day)
            
            # Morning preference check (Soft constraint)
            if slot.period > 3:
                # We won't penalize too heavily, but it is a soft constraint
                conflicts.append(Conflict(
                    type="afternoon_class",
                    description=f"Soft Preference: '{course.name}' scheduled in afternoon (Period {slot.period}) on {slot.day}.",
                    session_ids=[session.session_id],
                    severity="soft"
                ))
                soft_count += 1
                penalties += 0.5

    # Check gathered room clashes
    for (room_id, slot_id), sessions in room_slot_allocations.items():
        if len(sessions) > 1:
            room = room_map.get(room_id)
            room_name = room.name if room else room_id
            slot = slot_map.get(slot_id)
            day_desc = f"{slot.day} Period {slot.period}" if slot else slot_id
            conflicts.append(Conflict(
                type="room_clash",
                description=f"Room Clash: Multiple classes ({', '.join(sessions)}) scheduled in '{room_name}' on {day_desc}.",
                session_ids=sessions,
                severity="hard"
            ))
            clash_weight = len(sessions) - 1
            hard_count += clash_weight
            penalties += clash_weight * 10.0

    # Check gathered professor clashes
    for (prof_id, slot_id), sessions in prof_slot_allocations.items():
        if len(sessions) > 1:
            prof = prof_map.get(prof_id)
            prof_name = prof.name if prof else prof_id
            slot = slot_map.get(slot_id)
            day_desc = f"{slot.day} Period {slot.period}" if slot else slot_id
            conflicts.append(Conflict(
                type="professor_clash",
                description=f"Professor Clash: {prof_name} scheduled for multiple classes ({', '.join(sessions)}) on {day_desc}.",
                session_ids=sessions,
                severity="hard"
            ))
            clash_weight = len(sessions) - 1
            hard_count += clash_weight
            penalties += clash_weight * 10.0

    # Check spacing violations (Soft constraint)
    for course_id, days in course_days.items():
        day_counts = {}
        for day in days:
            day_counts[day] = day_counts.get(day, 0) + 1
        for day, count in day_counts.items():
            if count > 1:
                course = course_map.get(course_id)
                course_name = course.name if course else course_id
                conflicts.append(Conflict(
                    type="spacing_violation",
                    description=f"Soft Spacing: '{course_name}' has {count} classes on {day}. Better to spread them.",
                    session_ids=[s.session_id for s in schedule if s.course_id == course_id],
                    severity="soft"
                ))
                soft_count += (count - 1)
                penalties += (count - 1) * 2.0

    fitness = 1.0 / (1.0 + penalties)
    return fitness, conflicts, hard_count, soft_count


class GeneticSolver:
    def __init__(
        self, 
        courses: List[Course], 
        professors: List[Professor], 
        rooms: List[Room], 
        timeslots: List[Timeslot],
        pop_size: int = 100,
        mutation_rate: float = 0.15,
        elitism_size: int = 2
    ):
        self.courses = courses
        self.professors = professors
        self.rooms = rooms
        self.timeslots = timeslots
        
        self.pop_size = pop_size
        self.mutation_rate = mutation_rate
        self.elitism_size = elitism_size
        
        # Prepare session list to schedule
        self.sessions_to_schedule = []
        for course in self.courses:
            for s_idx in range(1, course.sessions_per_week + 1):
                self.sessions_to_schedule.append({
                    "session_id": f"{course.id}_{s_idx}",
                    "course_id": course.id
                })
                
        self.room_ids = [r.id for r in self.rooms]
        self.timeslot_ids = [t.id for t in self.timeslots]

    def _generate_random_genes(self) -> List[ScheduleSession]:
        schedule = []
        for s in self.sessions_to_schedule:
            schedule.append(ScheduleSession(
                session_id=s["session_id"],
                course_id=s["course_id"],
                room_id=random.choice(self.room_ids),
                timeslot_id=random.choice(self.timeslot_ids)
            ))
        return schedule

    def solve(self, generations: int = 150) -> Tuple[List[ScheduleSession], List[Dict]]:
        # Initialize population
        population = []
        for _ in range(self.pop_size):
            population.append(self._generate_random_genes())
            
        history = []
        
        for gen in range(1, generations + 1):
            # Evaluate all individuals
            evaluated_pop = []
            for ind in population:
                fit, confs, h_cnt, s_cnt = evaluate_schedule(
                    ind, self.courses, self.professors, self.rooms, self.timeslots
                )
                evaluated_pop.append((fit, ind, h_cnt, s_cnt))
                
            # Sort population by fitness descending (higher is better)
            evaluated_pop.sort(key=lambda x: x[0], reverse=True)
            
            best_fit, best_ind, best_hard, best_soft = evaluated_pop[0]
            
            # Log progress
            history.append({
                "generation": gen,
                "fitness": round(best_fit, 4),
                "hard_conflicts": best_hard,
                "soft_conflicts": best_soft
            })
            
            # Early stop if a perfect layout with 0 hard conflicts is found (optional, let's stop if fitness is 1.0, meaning 0 hard AND 0 soft)
            if best_fit >= 1.0 or (best_hard == 0 and gen >= 50): # Allow it to run a bit to resolve soft constraints
                # Return early if all resolved
                if best_hard == 0 and best_soft == 0:
                    # Let's fill the remaining history to maintain UI expectation
                    for remaining_gen in range(gen + 1, generations + 1):
                        history.append({
                            "generation": remaining_gen,
                            "fitness": round(best_fit, 4),
                            "hard_conflicts": best_hard,
                            "soft_conflicts": best_soft
                        })
                    return best_ind, history

            # Create next generation
            new_population = []
            
            # Elitism: carry over the best
            for i in range(min(self.elitism_size, self.pop_size)):
                new_population.append(copy.deepcopy(evaluated_pop[i][1]))
                
            # Selection and reproduction
            while len(new_population) < self.pop_size:
                parent_a = self._tournament_select(evaluated_pop)
                parent_b = self._tournament_select(evaluated_pop)
                
                child = self._crossover(parent_a, parent_b)
                self._mutate(child)
                new_population.append(child)
                
            population = new_population

        # Get final evaluations to return best
        evaluated_pop = []
        for ind in population:
            fit, confs, h_cnt, s_cnt = evaluate_schedule(
                ind, self.courses, self.professors, self.rooms, self.timeslots
            )
            evaluated_pop.append((fit, ind, h_cnt, s_cnt))
        evaluated_pop.sort(key=lambda x: x[0], reverse=True)
        
        return evaluated_pop[0][1], history

    def _tournament_select(self, evaluated_pop, k=3) -> List[ScheduleSession]:
        # Choose k random individuals and return the best one
        candidates = random.sample(evaluated_pop, k)
        candidates.sort(key=lambda x: x[0], reverse=True)
        return candidates[0][1]

    def _crossover(self, parent_a: List[ScheduleSession], parent_b: List[ScheduleSession]) -> List[ScheduleSession]:
        child = []
        # Since schedules have the same sessions at the same index, we perform uniform crossover
        for s_idx in range(len(parent_a)):
            if random.random() < 0.5:
                child.append(copy.deepcopy(parent_a[s_idx]))
            else:
                child.append(copy.deepcopy(parent_b[s_idx]))
        return child

    def _mutate(self, schedule: List[ScheduleSession]):
        for session in schedule:
            if random.random() < self.mutation_rate:
                # Mutate either room or timeslot (or both)
                if random.random() < 0.5:
                    session.room_id = random.choice(self.room_ids)
                else:
                    session.timeslot_id = random.choice(self.timeslot_ids)
