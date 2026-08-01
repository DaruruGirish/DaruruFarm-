"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const expense_entity_1 = require("./expense.entity");
let ExpenseService = class ExpenseService {
    expenseRepository;
    constructor(expenseRepository) {
        this.expenseRepository = expenseRepository;
    }
    async create(createExpenseDto, user) {
        const expense = this.expenseRepository.create({
            ...createExpenseDto,
            user,
        });
        return this.expenseRepository.save(expense);
    }
    async findAll(user) {
        return this.expenseRepository.find({
            where: { user: { id: user.id } },
            order: { date: 'DESC', id: 'DESC' },
        });
    }
    async findOne(id, user) {
        const expense = await this.expenseRepository.findOne({
            where: { id, user: { id: user.id } },
        });
        if (!expense) {
            throw new common_1.NotFoundException(`Expense with ID ${id} not found`);
        }
        return expense;
    }
    async update(id, updateExpenseDto, user) {
        const expense = await this.findOne(id, user);
        const updatedExpense = this.expenseRepository.merge(expense, updateExpenseDto);
        return this.expenseRepository.save(updatedExpense);
    }
    async remove(id, user) {
        const expense = await this.findOne(id, user);
        await this.expenseRepository.remove(expense);
    }
};
exports.ExpenseService = ExpenseService;
exports.ExpenseService = ExpenseService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(expense_entity_1.Expense)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExpenseService);
//# sourceMappingURL=expense.service.js.map