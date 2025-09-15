const Customer = require('../models/Customer');

class AudienceSegmentationService {
  
  // Build MongoDB query from audience rules
  static buildSegmentQuery(rules) {
    if (!rules || rules.length === 0) {
      return {};
    }
    
    // Simple case: only one rule
    if (rules.length === 1) {
      return this.buildCondition(rules[0]);
    }
    
    // Group rules by logical operator
    const andConditions = [];
    const orConditions = [];
    
    // First rule always starts a new segment without a logical operator
    let currentCondition = this.buildCondition(rules[0]);
    let currentGroupType = 'AND'; // Default to AND for first group
    let currentGroup = [currentCondition];
    
    // Process remaining rules
    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i];
      const prevRule = rules[i-1];
      const condition = this.buildCondition(rule);
      
      // Check logical operator from previous rule
      if (prevRule.logicalOperator === 'OR') {
        // If previous rule was OR, add current group to appropriate collection
        // and start new group with current condition
        if (currentGroupType === 'AND') {
          // If we were building an AND group, add it to andConditions
          if (currentGroup.length > 1) {
            andConditions.push({ $and: currentGroup });
          } else {
            andConditions.push(currentGroup[0]);
          }
        } else {
          // If we were building an OR group, add all items to orConditions
          orConditions.push(...currentGroup);
        }
        
        // Start new group with OR type
        currentGroupType = 'OR';
        currentGroup = [condition];
      } else {
        // If AND, just add to current group
        currentGroup.push(condition);
      }
    }
    
    // Add the final group
    if (currentGroupType === 'AND') {
      if (currentGroup.length > 1) {
        andConditions.push({ $and: currentGroup });
      } else {
        andConditions.push(currentGroup[0]);
      }
    } else {
      orConditions.push(...currentGroup);
    }
    
    // Combine AND and OR conditions
    const finalQuery = {};
    
    if (andConditions.length > 0) {
      if (andConditions.length === 1) {
        if (orConditions.length === 0) {
          return andConditions[0]; // Only one AND condition, no OR conditions
        } else {
          finalQuery.$and = andConditions;
        }
      } else {
        finalQuery.$and = andConditions;
      }
    }
    
    if (orConditions.length > 0) {
      if (orConditions.length === 1) {
        if (andConditions.length === 0) {
          return orConditions[0]; // Only one OR condition, no AND conditions
        } else {
          finalQuery.$or = orConditions;
        }
      } else {
        finalQuery.$or = orConditions;
      }
    }
    
    return finalQuery;
  }

  // Build individual condition based on field, operator, and value
  static buildCondition(rule) {
    const { field, operator, value } = rule;
    
    switch (field) {
      case 'totalSpending':
        return this.buildNumberCondition('totalSpending', operator, value);
      
      case 'visits':
        return this.buildNumberCondition('visits', operator, value);
      
      case 'daysSinceLastVisit':
        const dayValue = parseInt(value);
        if (isNaN(dayValue)) {
          throw new Error(`Invalid value for daysSinceLastVisit: ${value}. Must be a number.`);
        }
        
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - dayValue);
        daysAgo.setHours(0, 0, 0, 0); // Beginning of the day
        
        const nextDay = new Date(daysAgo);
        nextDay.setDate(nextDay.getDate() + 1);
        
        switch (operator) {
          case '>': // More than X days ago (before the date)
            return { lastVisit: { $lt: daysAgo } };
          case '<': // Less than X days ago (after the date)
            return { lastVisit: { $gt: daysAgo } };
          case '>=': // X or more days ago (on or before the date)
            return { lastVisit: { $lte: daysAgo } };
          case '<=': // X or fewer days ago (on or after the date)
            return { lastVisit: { $gte: daysAgo } };
          case '==': // Exactly X days ago
            return { lastVisit: { $gte: daysAgo, $lt: nextDay } };
          case '!=': // Not exactly X days ago
            return { $or: [
              { lastVisit: { $lt: daysAgo } },
              { lastVisit: { $gte: nextDay } }
            ]};
          default:
            throw new Error(`Unsupported operator for daysSinceLastVisit: ${operator}`);
        }
      
      case 'registrationDate':
        const regDate = new Date(value);
        return this.buildDateCondition('registrationDate', operator, regDate);
      
      case 'segment':
        return this.buildSegmentCondition(operator, value);
      
      case 'isActive':
        return this.buildBooleanCondition('isActive', operator, value);
      
      case 'tags':
        return this.buildArrayCondition('tags', operator, value);
      
      default:
        throw new Error(`Unsupported field: ${field}`);
    }
  }

  static buildNumberCondition(field, operator, value) {
    const numValue = parseFloat(value);
    
    switch (operator) {
      case '>':
        return { [field]: { $gt: numValue } };
      case '<':
        return { [field]: { $lt: numValue } };
      case '>=':
        return { [field]: { $gte: numValue } };
      case '<=':
        return { [field]: { $lte: numValue } };
      case '==':
        return { [field]: numValue };
      case '!=':
        return { [field]: { $ne: numValue } };
      default:
        throw new Error(`Unsupported operator for number field: ${operator}`);
    }
  }

  static buildDateCondition(field, operator, value) {
    let date;
    if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format for ${field}: ${value}`);
      }
      // Set to beginning of the day
      date.setHours(0, 0, 0, 0);
    } else if (value instanceof Date) {
      date = new Date(value);
      date.setHours(0, 0, 0, 0);
    } else {
      throw new Error(`Invalid date value for ${field}: ${value}`);
    }
    
    // Create end of day date
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    switch (operator) {
      case '>':
        return { [field]: { $gt: endOfDay } };
      case '<':
        return { [field]: { $lt: date } };
      case '>=':
        return { [field]: { $gte: date } };
      case '<=':
        return { [field]: { $lte: endOfDay } };
      case '==':
        return { [field]: { $gte: date, $lte: endOfDay } };
      case '!=':
        return { $or: [
          { [field]: { $lt: date } },
          { [field]: { $gt: endOfDay } }
        ]};
      default:
        throw new Error(`Unsupported operator for date field: ${operator}`);
    }
  }

  static buildSegmentCondition(operator, value) {
    // Check if the value is already a valid segment in the schema
    const validSegments = ['premium', 'regular', 'standard', 'vip', 'bronze', 'silver', 'gold'];
    
    if (validSegments.includes(value)) {
      switch (operator) {
        case '==':
          return { segment: value };
        case '!=':
          return { segment: { $ne: value } };
        case 'contains':
          return { segment: { $regex: value, $options: 'i' } };
        case 'not_contains':
          return { segment: { $not: { $regex: value, $options: 'i' } } };
        default:
          throw new Error(`Unsupported operator for segment field: ${operator}`);
      }
    } else {
      // For backward compatibility with old segment conditions
      const segmentConditions = {
        'VIP': { totalSpending: { $gte: 50000 } },
        'Premium': { totalSpending: { $gte: 20000, $lt: 50000 } },
        'Regular': { totalSpending: { $gte: 5000, $lt: 20000 } },
        'New': { totalSpending: { $lt: 5000 } }
      };
      
      const condition = segmentConditions[value];
      if (!condition) {
        throw new Error(`Unsupported segment value: ${value}`);
      }
      
      switch (operator) {
        case '==':
          return condition;
        case '!=':
          return { $not: condition };
        default:
          throw new Error(`Unsupported operator for segment field: ${operator}`);
      }
    }
  }

  static buildBooleanCondition(field, operator, value) {
    const boolValue = value === true || value === 'true';
    
    switch (operator) {
      case '==':
        return { [field]: boolValue };
      case '!=':
        return { [field]: { $ne: boolValue } };
      default:
        throw new Error(`Unsupported operator for boolean field: ${operator}`);
    }
  }

  static buildArrayCondition(field, operator, value) {
    // Handle array or string value
    const processedValue = typeof value === 'string' 
      ? value.split(',').map(v => v.trim()) 
      : Array.isArray(value) ? value : [value];
    
    switch (operator) {
      case 'contains':
        return { [field]: { $in: processedValue } };
      case 'not_contains':
        return { [field]: { $nin: processedValue } };
      case '==': // Exact match for the array (must contain exactly these values)
        if (processedValue.length === 1) {
          return { [field]: processedValue[0] };
        } else {
          return { [field]: { $all: processedValue, $size: processedValue.length } };
        }
      case '!=': // Not an exact match
        if (processedValue.length === 1) {
          return { [field]: { $ne: processedValue[0] } };
        } else {
          return { $or: [
            { [field]: { $not: { $all: processedValue } } },
            { [field]: { $not: { $size: processedValue.length } } }
          ]};
        }
      default:
        throw new Error(`Unsupported operator for array field: ${operator}`);
    }
  }

  // Get audience count for preview
  static async getAudienceCount(rules) {
    try {
      const query = this.buildSegmentQuery(rules);
      const count = await Customer.countDocuments(query);
      return count;
    } catch (error) {
      throw new Error(`Error calculating audience size: ${error.message}`);
    }
  }

  // Get actual audience customers
  static async getAudience(rules, limit = null) {
    try {
      const query = this.buildSegmentQuery(rules);
      let customerQuery = Customer.find(query);
      
      if (limit) {
        customerQuery = customerQuery.limit(limit);
      }
      
      const customers = await customerQuery.select('_id name email phone totalSpending visits lastVisit');
      return customers;
    } catch (error) {
      throw new Error(`Error fetching audience: ${error.message}`);
    }
  }

  // Validate audience rules
  static validateRules(rules) {
    if (!Array.isArray(rules)) {
      throw new Error('Rules must be an array');
    }

    const validFields = ['totalSpending', 'visits', 'daysSinceLastVisit', 'registrationDate', 
                        'segment', 'isActive', 'tags', 'totalSpent', 'orderCount', 'lastOrderDate'];
    const validOperators = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'not_contains'];
    const validLogicalOperators = ['AND', 'OR'];
    const validSegments = ['premium', 'regular', 'standard', 'vip', 'bronze', 'silver', 'gold', 
                          'VIP', 'Premium', 'Regular', 'New']; // Include both old and new values

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      
      if (!rule.field || !validFields.includes(rule.field)) {
        throw new Error(`Invalid field at rule ${i}: ${rule.field}`);
      }
      
      if (!rule.operator || !validOperators.includes(rule.operator)) {
        throw new Error(`Invalid operator at rule ${i}: ${rule.operator}`);
      }
      
      if (rule.value === undefined || rule.value === null) {
        throw new Error(`Missing value at rule ${i}`);
      }
      
      // Don't validate logical operator for last rule
      if (i < rules.length - 1) {
        // Default to AND if not specified
        if (!rule.logicalOperator) {
          rule.logicalOperator = 'AND';
        } else if (!validLogicalOperators.includes(rule.logicalOperator)) {
          throw new Error(`Invalid logical operator at rule ${i}: ${rule.logicalOperator}`);
        }
      }
      
      // Field-specific validations
      if (['totalSpending', 'totalSpent', 'visits', 'daysSinceLastVisit', 'orderCount'].includes(rule.field)) {
        const numValue = parseFloat(rule.value);
        if (isNaN(numValue)) {
          throw new Error(`Invalid numeric value at rule ${i}: ${rule.value}`);
        }
        // Convert string to number
        rule.value = numValue;
      }
      
      if (rule.field === 'segment' && !validSegments.includes(rule.value)) {
        throw new Error(`Invalid segment value at rule ${i}: ${rule.value}. Valid values are: ${validSegments.join(', ')}`);
      }
      
      if (rule.field === 'isActive') {
        if (typeof rule.value === 'string') {
          rule.value = rule.value.toLowerCase() === 'true';
        } else if (typeof rule.value !== 'boolean') {
          throw new Error(`Invalid boolean value at rule ${i}: ${rule.value}`);
        }
      }
      
      if (['registrationDate', 'lastOrderDate', 'lastVisit'].includes(rule.field)) {
        if (typeof rule.value === 'string') {
          const dateValue = new Date(rule.value);
          if (isNaN(dateValue.getTime())) {
            throw new Error(`Invalid date value at rule ${i}: ${rule.value}`);
          }
          // Convert string to date
          rule.value = dateValue;
        } else if (!(rule.value instanceof Date)) {
          throw new Error(`Invalid date value at rule ${i}: ${rule.value}`);
        }
      }
      
      // Operator compatibility with fields
      if (['contains', 'not_contains'].includes(rule.operator) && 
          !['tags', 'segment'].includes(rule.field)) {
        throw new Error(`Operator ${rule.operator} is only valid for tags or segment fields`);
      }
      
      if (rule.field === 'tags' && 
          !['contains', 'not_contains', '==', '!='].includes(rule.operator)) {
        throw new Error(`Invalid operator for tags field: ${rule.operator}`);
      }
    }

    return true;
  }

  // Generate sample rules for testing
  static generateSampleRules() {
    return [
      {
        field: 'totalSpending',
        operator: '>',
        value: 10000,
        logicalOperator: 'AND'
      },
      {
        field: 'visits',
        operator: '<',
        value: 3,
        logicalOperator: 'OR'
      },
      {
        field: 'daysSinceLastVisit',
        operator: '>=',
        value: 90
      }
    ];
  }
}

module.exports = AudienceSegmentationService;
