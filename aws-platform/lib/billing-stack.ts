import { Stack, StackProps } from 'aws-cdk-lib';
import * as budgets from 'aws-cdk-lib/aws-budgets';
import { Construct } from 'constructs';
import { monthlyBudget } from '../config/organization';

// Org-wide monthly cost budget. Lives in the management account (consolidated
// billing sees every member) and in us-east-1 (Budgets is global there).
export class BillingStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { name, limitUsd, alertEmails } = monthlyBudget;

    new budgets.CfnBudget(this, 'MonthlyBudget', {
      budget: {
        budgetName: name,
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: { amount: limitUsd, unit: 'USD' },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            notificationType: 'ACTUAL',
            comparisonOperator: 'GREATER_THAN',
            threshold: 100,
            thresholdType: 'PERCENTAGE',
          },
          subscribers: alertEmails.map((address) => ({ subscriptionType: 'EMAIL', address })),
        },
      ],
    });
  }
}
