import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { Box } from '@mui/material';
import DroppableRuleList from './DroppableRuleList';
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

interface DragDropRuleBuilderProps {
  rules: AudienceRule[];
  fieldOptions: FieldOption[];
  operatorOptions: OperatorOptions;
  updateRule: (index: number, field: keyof AudienceRule, value: any) => void;
  removeRule: (index: number) => void;
  addRule: () => void;
  setRules: (rules: AudienceRule[]) => void;
  validationError: boolean;
  validationMessage?: string;
}

const DragDropRuleBuilder: React.FC<DragDropRuleBuilderProps> = ({
  rules,
  fieldOptions,
  operatorOptions,
  updateRule,
  removeRule,
  addRule,
  setRules,
  validationError,
  validationMessage,
}) => {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    
    // If no destination or dropped in the same place, do nothing
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Reorder the rules array
    const newRules = [...rules];
    const [removed] = newRules.splice(source.index, 1);
    newRules.splice(destination.index, 0, removed);
    
    // Update logical operators based on new positions
    const updatedRules = newRules.map((rule, index) => {
      if (index === 0) {
        // First rule doesn't need a logical operator
        return { ...rule, logicalOperator: undefined };
      } else {
        // Make sure rules after the first one have a logical operator
        return { ...rule, logicalOperator: rule.logicalOperator || 'AND' };
      }
    });
    
    // Update the rules state
    setRules(updatedRules);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box>
        <DroppableRuleList
          rules={rules}
          fieldOptions={fieldOptions}
          operatorOptions={operatorOptions}
          updateRule={updateRule}
          removeRule={removeRule}
          addRule={addRule}
          validationError={validationError}
          validationMessage={validationMessage}
        />
      </Box>
    </DragDropContext>
  );
};

export default DragDropRuleBuilder;