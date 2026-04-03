import {
  ValidatorConstraint,
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from "class-validator";

export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {},
      constraints: [property],
      validator: IsAfterDateConstraint,
    });
  };
}
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {},
      constraints: [],
      validator: IsFutureDateConstraint,
    });
  };
}

@ValidatorConstraint({ name: "isAfterDate", async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    const relatedPropertyName = args.constraints[0];

    const relatedValue = (args.object as any)[relatedPropertyName];

    if (propertyValue === undefined || relatedValue === undefined) return true;

    const datePropertyValue = new Date(propertyValue);
    const dateRelatedValue = new Date(relatedValue);
    if (isNaN(datePropertyValue.getTime()) || isNaN(dateRelatedValue.getTime()))
      return true;

    return datePropertyValue > dateRelatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const relatedPropertyName = args.constraints[0];
    return `La date doit être postérieure à ${relatedPropertyName}.`;
  }
}

@ValidatorConstraint({ name: "isFutureDate", async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (value === undefined) return true;

    const dateToValidate = new Date(value);

    if (isNaN(dateToValidate.getTime())) return true;

    return dateToValidate >= new Date();
  }

  defaultMessage() {
    return "La date doit être dans le futur.";
  }
}
