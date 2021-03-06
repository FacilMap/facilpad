import WithRender from "./colour-field.vue";
import Vue from "vue";
import { Component, Ref } from "vue-property-decorator";
import { ColorMixin, Hue, Saturation } from "vue-color";
import "./colour-field.scss";
import Picker from "../picker/picker";
import { extend } from "vee-validate";
import { makeTextColour } from "facilmap-utils";
import { arrowNavigation } from "../../../utils/ui";

function normalizeData(value: string) {
	return ColorMixin.data.apply({ value }).val;
}

function isValidColour(colour?: string) {
	return !!colour?.match(/^[a-fA-F0-9]{3}([a-fA-F0-9]{3})?$/);
}

extend("colour", {
	validate: isValidColour,
	message: "Needs to be in 3-digit or 6-digit hex format, for example <code>f00</code> or <code>0000ff</code>."
});

@WithRender
@Component({
	components: { Picker, Hue, Saturation },
	props: {
		...(Picker as any).options.props
	}
})
export default class ColourField extends Vue {

	@Ref() grid!: HTMLElement;

	value?: string;

	colours = [ "ffffff", "ffccc9", "ffce93", "fffc9e", "ffffc7", "9aff99", "96fffb", "cdffff", "cbcefb", "cfcfcf", "fd6864",
	"fe996b", "fffe65", "fcff2f", "67fd9a", "38fff8", "68fdff", "9698ed", "c0c0c0", "fe0000", "f8a102", "ffcc67", "f8ff00", "34ff34",
	"68cbd0", "34cdf9", "6665cd", "9b9b9b", "cb0000", "f56b00", "ffcb2f", "ffc702", "32cb00", "00d2cb", "3166ff", "6434fc", "656565",
	"9a0000", "ce6301", "cd9934", "999903", "009901", "329a9d", "3531ff", "6200c9", "343434", "680100", "963400", "986536", "646809",
	"036400", "34696d", "00009b", "303498", "000000", "330001", "643403", "663234", "343300", "013300", "003532", "010066", "340096" ];

	get val(): any {
		return normalizeData(this.value ?? "");
	}

	get previewStyle(): Partial<CSSStyleDeclaration> {
		const bg = isValidColour(this.value) ? this.value : 'ffffff';
		return {
			backgroundColor: `#${bg}`,
			color: makeTextColour(`#${bg}`)
		};
	}

	handleChange(val: any): void {
		this.$emit('input', normalizeData(val).hex.replace(/^#/, '').toLowerCase());
	}

	handleKeyDown(event: KeyboardEvent): void {
		const newVal = arrowNavigation(this.colours, this.value, this.grid, event);
		if (newVal) {
			this.$emit('input', newVal);
			setTimeout(() => {
				this.grid.querySelector<HTMLElement>(".active a")?.focus();
			}, 0);
		}
	}

}