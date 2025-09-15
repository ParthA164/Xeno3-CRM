import React from 'react';
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import {
  Card,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  SelectChangeEvent,
} from '@mui/material';
import { Delete, DragIndicator } from '@mui/icons-material';
import { AudienceRule } from '../../utils/api';

interface FieldOption {
  value: string;
  label: string;
  type: string;
}

interface OperatorOption {
  value: string;
  label: string;
}

interface OperatorOptions {
  [key: string]: OperatorOption[];
}

interface DraggableRuleItemProps {
  rule: AudienceRule;
  index: number;
  isFirst: boolean;
  fieldOptions: FieldOption[];
  operatorOptions: OperatorOptions;
  updateRule: (index: number, field: keyof AudienceRule, value: any) => void;
  removeRule: (index: number) => void;
  validationError?: boolean;
}

const DraggableRuleItem: React.FC<DraggableRuleItemProps> = ({
  rule,
  index,
  isFirst,
  fieldOptions,
  operatorOptions,
  updateRule,
  removeRule,
  validationError,
}) => {
  const getOperatorsForField = (fieldName: string) => {
    const field = fieldOptions.find(f => f.value === fieldName);
    return operatorOptions[field?.type as keyof typeof operatorOptions] || operatorOptions.text;
  };

  const handleFieldChange = (e: SelectChangeEvent) => {
    const newField = e.target.value;
    
    // When field type changes, we need to update the operator to a valid one for the new field type
    const fieldType = fieldOptions.find(f => f.value === newField)?.type || 'text';
    const validOperators = operatorOptions[fieldType];
    const newOperator = validOperators[0].value;
    
    updateRule(index, 'field', newField);
    updateRule(index, 'operator', newOperator);
  };

  return (
    <Draggable draggableId={`rule-${index}`} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps as any}
        >
          <Card
            variant="outlined"
            sx={{ mb: 2, p: 2 }}
          >
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Drag handle */}
              <div {...provided.dragHandleProps as any}>
                <Box sx={{ cursor: 'grab', color: 'text.secondary' }}>
                  <DragIndicator />
                </Box>
              </div>
            
            {/* Logical operator (AND/OR) for rules after the first one */}
            {!isFirst && (
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Logic</InputLabel>
                <Select
                  value={rule.logicalOperator || 'AND'}
                  label="Logic"
                  onChange={(e) => updateRule(index, 'logicalOperator', e.target.value)}
                >
                  <MenuItem value="AND">AND</MenuItem>
                  <MenuItem value="OR">OR</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {/* Field selector */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Field</InputLabel>
              <Select
                value={rule.field}
                label="Field"
                onChange={handleFieldChange}
              >
                {fieldOptions.map((field) => (
                  <MenuItem key={field.value} value={field.value}>
                    {field.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Operator selector */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Operator</InputLabel>
              <Select
                value={rule.operator}
                label="Operator"
                onChange={(e) => updateRule(index, 'operator', e.target.value)}
              >
                {getOperatorsForField(rule.field).map((op) => (
                  <MenuItem key={op.value} value={op.value}>
                    {op.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Value input */}
            <TextField
              size="small"
              label="Value"
              value={rule.value}
              onChange={(e) => updateRule(index, 'value', e.target.value)}
              type={fieldOptions.find(f => f.value === rule.field)?.type === 'number' ? 'number' : 'text'}
              sx={{ minWidth: 100 }}
              error={validationError && rule.value === ''}
            />

            {/* Delete button */}
            <IconButton
              onClick={() => removeRule(index)}
              color="error"
              size="small"
            >
              <Delete />
            </IconButton>
          </Box>
        </Card>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableRuleItem;