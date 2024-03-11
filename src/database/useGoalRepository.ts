import { useSQLiteContext } from "expo-sqlite/next";

export type GoalResponseDatabase = {
    id: string;
    name: string;
    total: number;
    current: number;
}

export function useGoalRepository() {
    const database = useSQLiteContext();

    function create(goal: {name: string; total: number}) {
        const statement = database.prepareSync(
            "INSERT INTO goals (name, total) VALUES ($name, $total)"
        );

        try {            
            statement.executeSync({
                $name: goal.name,
                $total: goal.total
            })
        } catch (error) {
            throw new Error("Error when inserting on goals: " + error);
            
        }
    }

    function all() {
        try {
            return database.getAllSync<GoalResponseDatabase>(`
            SELECT g.id, g.name, g.total, COALESCE(SUM(t.amount), 0) AS current 
            FROM goals AS g 
            LEFT JOIN transactions t ON t.goal_id = g.id 
            GROUP BY g.id, g.name, g.total;
            `)
        } catch (error) {
            throw new Error("Error on SELECT command on goals and transactions: " + error);
        }
    }

    function show(id: number) {
        const statement = database.prepareSync(`
            SELECT g.id, g.name, g.total, COALESCE(SUM(t.amount), 0) AS current 
            FROM goals AS g 
            LEFT JOIN transactions t ON t.goal_id = g.id 
            WHERE g.id = $id
            GROUP BY g.id, g.name, g.total;
        `)

        const result = statement.executeSync<GoalResponseDatabase>({$id: id});

        return result.getFirstSync();
    }


    return {
        create,
        all,
        show,
    }
}