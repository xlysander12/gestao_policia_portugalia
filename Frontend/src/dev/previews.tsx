import {ComponentPreview, Previews} from "@react-buddy/ide-toolbox";
import {PaletteTree} from "./palette";
import FeedbackModal from "../components/Navbar/modals/feedback.tsx";
import {DefaultDateCalendar} from "../components/DefaultComponents";

const ComponentPreviews = () => {
    return (
        <Previews palette={<PaletteTree/>}>
            <ComponentPreview path="/FeedbackModal">
                <FeedbackModal type={"error"} open={false} onClose={function(): void {
                    throw new Error("Function not implemented.");
                } }/>
            </ComponentPreview>
            <ComponentPreview path="/DefaultDateCalendar">
                <DefaultDateCalendar/>
            </ComponentPreview>
        </Previews>
    );
};

export default ComponentPreviews;