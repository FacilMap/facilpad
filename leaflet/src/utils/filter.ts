import { compileExpression as filtrexCompileExpression } from 'filtrex';
import { clone, flattenObject, quoteRegExp } from "./utils";
import { ID, Marker, Line, Type, Field } from "facilmap-types";

export type FilterFunc = (obj: any) => boolean;

const customFuncs = {
	prop(obj: any, key: string) {
		return obj && obj[key];
	},

	random() { } // Does not work well with angular digest cycles
};

export function filterHasError(expr: string): Error | void {
	try {
		if(expr && expr.trim())
			filtrexCompileExpression(expr, { extraFunctions: customFuncs });
	} catch(e) {
		return e;
	}
}

export function compileExpression(expr?: string): FilterFunc {
	if(!expr || !expr.trim())
		return function() { return true; };
	else
		return filtrexCompileExpression(expr, { extraFunctions: customFuncs });
}

export function quote(str: string): string {
	return '"' + (""+str).replace(/["\\]/g, '\\$1').replace(/\n/g, "\\n") + '"';
}

export function _getMatchesWithBrackets(str: string, regexp: string): string[] {
	const ret: string[] = [ ];

	(str || "").replace(new RegExp(regexp, "gi"), (match, ...args) => {
		const offset = args[args.length-2];

		const open = match.match(/\(/g);
		const close = match.match(/\)/g);
		let needBraces = (open ? open.length : 0) - (close ? close.length : 0);
		let i = offset+match.length;
		for(; i<str.length && needBraces > 0; i++) {
			if(str[i] == "(")
				needBraces++;
			else if(str[i] == ")")
				needBraces--;
		}

		ret.push(str.substring(offset, i));

		return match;
	});

	return ret;
}

export function makeTypeFilter(previousFilter: string, typeId: ID, filteredData: boolean | Record<string, Record<string, boolean>>): string {
	function removePart(str: string, regexp: string[]) {
		str = str || "";
		for (const r of regexp) {
			str = str
				.replace(new RegExp("^" + r + "($|\\s+and\\s+|\\s+or\\s+)", "ig"), "")
				.replace(new RegExp("\\s+(and|or)\\s+" + r + "($|[^0-9a-z])", "ig"), (...args) => args[args.length-3])
		}
		return str;
	}

	let ret = removePart(previousFilter,
		_getMatchesWithBrackets(previousFilter, "(not\\s+)?\\(typeId\\s*==\\s*" + typeId).map(quoteRegExp)
			.concat([ "typeId\\s*[!=]=\\s*" + typeId ]));

	if(typeof filteredData == "boolean") {
		if(filteredData)
			ret = (ret ? ret + " and " : "") + "typeId!=" + typeId;
	} else {
		const append = [ ];
		for(const i in filteredData) {
			const no = Object.keys(filteredData[i]).filter(function(it) { return !filteredData[i][it]; });
			const yes = Object.keys(filteredData[i]).filter(function(it) { return filteredData[i][it]; });

			if(no.length == 0) // No item is not filtered, so we can filter the whole type
				return (ret ? ret + " and " : "") + "typeId!=" + typeId;

			if(yes.length > 0) {
				const negative = "prop(data," + quote(i) + ")" + (no.length > 1 ? " not in (" + no.map(quote).join(",") + ")" : "!=" + quote(no[0]));
				const positive = "prop(data," + quote(i) + ")" + (yes.length > 1 ? " in (" + yes.map(quote).join(",") + ")" : "==" + quote(yes[0]));

				append.push(negative.length < positive.length ? negative : positive);
			}
		}

		if(append.length > 0)
			ret = (ret ? ret + " and " : "") + "not (typeId=="+typeId+" and " + (append.length > 1 ? "(" + append.join(" or ") + ")" : append[0]) + ")";
	}

	return ret;
}

export function prepareObject<T extends Marker | Line>(obj: T, type: Type): T & { type?: Type["type"] } {
	obj = clone(obj);

	for (const field of type.fields) {
		obj.data[field.name] = normalizeField(field, obj.data[field.name], true);
	}

	const ret = flattenObject(obj) as T & { type?: Type["type"] };

	if(type)
		ret.type = type.type;

	return ret;
}

export function normalizeField(field: Field, value: string, enforceExistingOption: boolean): string {
	if(value == null)
		value = field['default'] || "";

	if(field.type == "checkbox")
		value = value == "1" ? "1" : "0";

	if(enforceExistingOption && field.type == "dropdown" && !field.options?.some((option) => option.value == value) && field.options?.[0])
		value = field.options[0].value;

	return value;
}