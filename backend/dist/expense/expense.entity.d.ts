import { User } from '../auth/user.entity';
export declare enum ExpenseCategory {
    FERTILIZER = "Fertilizer",
    PESTICIDES = "Pesticides",
    ELECTRICITY = "Electricity",
    DIESEL = "Diesel",
    WATER = "Water",
    WORKERS = "Workers",
    EQUIPMENT = "Equipment",
    TRANSPORTATION = "Transportation",
    MISCELLANEOUS = "Miscellaneous"
}
export declare class Expense {
    id: number;
    amount: number;
    category: ExpenseCategory;
    notes: string;
    date: Date;
    user: User;
}
